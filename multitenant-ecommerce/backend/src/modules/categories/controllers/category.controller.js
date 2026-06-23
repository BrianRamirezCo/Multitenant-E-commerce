const Category = require("../../../models/Category");
const Product = require("../../../models/Product");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Category controllers. All queries auto-scoped to the current tenant.
 *
 * List includes a productCount per category (how many products use that
 * category slug), computed with a tenant-scoped aggregation.
 */

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
// Used by the enforceLimit middleware to count current categories for the tenant.
exports.countCategories = async () => Category.countDocuments();

// GET /categories  -> list categories with product counts
exports.listCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();

  // Count products per category slug for this tenant.
  // aggregate() bypasses the isolation plugin, so we scope tenantId manually.
  const counts = await Product.aggregate([
    { $match: { tenantId: req.tenant._id, category: { $ne: null } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  const enriched = categories.map((c) => ({
    ...c,
    productCount: countMap.get(c.slug) || 0,
  }));
  res.json({ status: "success", total: enriched.length, categories: enriched });
});

// POST /categories
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, image, order } = req.body;
  if (!name) return next(new AppError("Name is required.", 400));

  const slug = slugify(req.body.slug || name);
  try {
    // Set tenantId explicitly from the resolved tenant (don't rely on async context).
    const category = await Category.create({
      name,
      slug,
      description,
      image,
      order,
      tenantId: req.tenant._id,
    });
    res.status(201).json({ status: "success", category });
  } catch (err) {
    if (err.code === 11000)
      return next(
        new AppError("A category with that slug already exists.", 409),
      );
    throw err;
  }
});

// PATCH /categories/:id
exports.updateCategory = catchAsync(async (req, res, next) => {
  const update = { ...req.body };
  if (update.slug) update.slug = slugify(update.slug);
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id },
    update,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!category) return next(new AppError("Category not found", 404));
  res.json({ status: "success", category });
});

// DELETE /categories/:id
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id });
  if (!category) return next(new AppError("Category not found", 404));
  res.status(204).send();
});
