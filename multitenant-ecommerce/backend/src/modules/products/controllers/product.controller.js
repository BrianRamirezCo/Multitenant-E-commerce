const Product = require("../../../models/Product");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Product controllers.
 *
 * NOTICE: none of these handlers pass tenantId to the queries.
 * The tenant isolation plugin injects it automatically based on the request
 * context opened by the tenant resolver middleware. This is the whole point:
 * you literally cannot forget to scope a query, because you never write it.
 */

// Escapes user input so it can be used safely inside a RegExp (avoids errors
// and regex-injection when the search term contains special characters).
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Used by the enforceLimit middleware to count current products for the tenant.
// The tenant plugin scopes countDocuments() to the current tenant automatically.
exports.countProducts = async () => Product.countDocuments();

// GET /products  -> list this tenant's active products
// Supports optional ?category=<slug> and ?search=<text> (a.k.a. ?q=).
exports.listProducts = catchAsync(async (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  const search = (req.query.search || req.query.q || "").trim();

  const filter = { isActive: true };
  if (category) filter.category = category;

  // Text search over name + description (case-insensitive).
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { description: rx }];
  }

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(filter);

  res.json({ status: "success", total, page: Number(page), products });
});

// GET /products/:slug  -> single product by slug
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return next(new AppError("Product not found", 404));
  res.json({ status: "success", product });
});

// POST /products  -> create a product (admin only)
exports.createProduct = catchAsync(async (req, res) => {
  // Set tenantId explicitly from the resolved tenant. We don't rely on the
  // async context here because it can be lost across awaits in create().
  const product = await Product.create({
    ...req.body,
    tenantId: req.tenant._id,
  });
  res.status(201).json({ status: "success", product });
});
// PATCH /products/:id  -> update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!product) return next(new AppError("Product not found", 404));
  res.json({ status: "success", product });
});

// DELETE /products/:id  -> delete a product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id });
  if (!product) return next(new AppError("Product not found", 404));
  res.status(204).send();
});
