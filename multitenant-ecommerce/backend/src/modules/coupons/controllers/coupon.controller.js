const Coupon = require("../../../models/Coupon");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Coupon controllers. All queries auto-scoped to the current tenant.
 *
 * Admin: CRUD. Storefront: a public validate endpoint to apply a code at
 * checkout. The per-plan creation limit is enforced by middleware (enforceLimit)
 * using countCoupons below.
 */

// Used by the enforceLimit middleware to count current coupons for the tenant.
exports.countCoupons = async () => Coupon.countDocuments();

// GET /coupons  -> list (admin)
exports.listCoupons = catchAsync(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ status: "success", total: coupons.length, coupons });
});

// POST /coupons  -> create (admin)
exports.createCoupon = catchAsync(async (req, res, next) => {
  const { code, type, value, minPurchase, usageLimit, expiresAt } = req.body;
  if (!code || !type || value == null) {
    return next(new AppError("Code, type and value are required.", 400));
  }
  if (!["percentage", "fixed"].includes(type)) {
    return next(new AppError("Invalid discount type.", 400));
  }
  try {
    // Set tenantId explicitly from the resolved tenant (don't rely on async context).
    const coupon = await Coupon.create({
      code,
      type,
      value,
      minPurchase: minPurchase || 0,
      usageLimit: usageLimit || null,
      expiresAt: expiresAt || null,
      tenantId: req.tenant._id,
    });
    res.status(201).json({ status: "success", coupon });
  } catch (err) {
    if (err.code === 11000)
      return next(new AppError("A coupon with that code already exists.", 409));
    throw err;
  }
});

// PATCH /coupons/:id  -> update (admin)
exports.updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!coupon) return next(new AppError("Coupon not found", 404));
  res.json({ status: "success", coupon });
});

// DELETE /coupons/:id  -> delete (admin)
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id });
  if (!coupon) return next(new AppError("Coupon not found", 404));
  res.status(204).send();
});

// POST /coupons/validate  -> validate a code against a subtotal (storefront)
// Body: { code, subtotal } (subtotal in cents). Returns discount if valid.
exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { code, subtotal } = req.body;
  if (!code) return next(new AppError("Coupon code is required.", 400));

  const coupon = await Coupon.findOne({
    code: String(code).toUpperCase().trim(),
  });
  if (!coupon) return next(new AppError("Invalid coupon code.", 404));

  const result = coupon.evaluate(Number(subtotal) || 0);
  if (!result.valid) {
    return res.json({ status: "success", valid: false, reason: result.reason });
  }

  res.json({
    status: "success",
    valid: true,
    discount: result.discount,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
  });
});
