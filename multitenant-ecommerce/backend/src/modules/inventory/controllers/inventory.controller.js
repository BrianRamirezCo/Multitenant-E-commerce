const Product = require('../../../models/Product');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Inventory controllers (admin). A stock-focused view over Products.
 * All queries auto-scoped to the current tenant.
 */

// GET /inventory  -> products with stock info + summary counts
exports.getInventory = catchAsync(async (req, res) => {
  const products = await Product.find()
    .select('name stock lowStockThreshold category images')
    .sort({ stock: 1 }) // lowest stock first (most urgent)
    .lean();

  // Classify each product and build summary counts.
  let inStock = 0, lowStock = 0, outOfStock = 0;
  const items = products.map((p) => {
    let state;
    if (p.stock === 0) { state = 'out'; outOfStock++; }
    else if (p.stock <= (p.lowStockThreshold ?? 10)) { state = 'low'; lowStock++; }
    else { state = 'ok'; inStock++; }
    return { ...p, state };
  });

  res.json({
    status: 'success',
    summary: { total: products.length, inStock, lowStock, outOfStock },
    items,
  });
});

// PATCH /inventory/:id  -> quick stock / threshold update for one product
exports.updateStock = catchAsync(async (req, res, next) => {
  const { stock, lowStockThreshold } = req.body;
  const update = {};
  if (stock != null) {
    if (stock < 0) return next(new AppError('Stock cannot be negative.', 400));
    update.stock = stock;
  }
  if (lowStockThreshold != null) {
    if (lowStockThreshold < 0) return next(new AppError('Threshold cannot be negative.', 400));
    update.lowStockThreshold = lowStockThreshold;
  }
  if (Object.keys(update).length === 0) {
    return next(new AppError('Nothing to update.', 400));
  }

  const product = await Product.findOneAndUpdate({ _id: req.params.id }, update, {
    new: true, runValidators: true,
  }).select('name stock lowStockThreshold');
  if (!product) return next(new AppError('Product not found', 404));

  res.json({ status: 'success', product });
});
