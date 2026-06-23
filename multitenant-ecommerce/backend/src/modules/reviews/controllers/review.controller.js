const Review = require("../../../models/Review");
const Order = require("../../../models/Order");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Review controllers. All queries are auto-scoped to the current tenant.
 */

// Helper: has this customer purchased this product in a paid/fulfilled order?
async function hasPurchased(customerId, productId) {
  const order = await Order.findOne({
    customer: customerId,
    status: { $in: ["paid", "fulfilled"] },
    "items.product": productId,
  });
  return Boolean(order);
}

// POST /reviews  -> create or update the current customer's review for a product
exports.createReview = catchAsync(async (req, res, next) => {
  const { product, rating, comment } = req.body;

  if (!product) return next(new AppError("Product is required.", 400));
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return next(new AppError("Rating must be between 1 and 5.", 400));
  }

  const verified = await hasPurchased(req.user._id, product);

  const existing = await Review.findOne({ product, customer: req.user._id });

  let review;
  if (existing) {
    existing.rating = numRating;
    existing.comment = comment || "";
    existing.status = "pending";
    existing.verifiedPurchase = verified;
    existing.authorName = req.user.name;
    review = await existing.save();
  } else {
    review = await Review.create({
      tenantId: req.tenant._id,
      product,
      customer: req.user._id,
      authorName: req.user.name,
      rating: numRating,
      comment: comment || "",
      status: "pending",
      verifiedPurchase: verified,
    });
  }

  res.status(201).json({ status: "success", review });
});

// GET /reviews/product/:productId  -> approved reviews + aggregate for a product
exports.getProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({
    product: productId,
    status: "approved",
  }).sort({ createdAt: -1 });

  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  res.json({
    status: "success",
    count,
    average: Math.round(average * 10) / 10,
    reviews,
  });
});

// GET /reviews/mine/:productId  -> the current customer's own review (any status)
exports.getMyReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({
    product: req.params.productId,
    customer: req.user._id,
  });
  res.json({ status: "success", review: review || null });
});

// GET /reviews  -> list all reviews for the tenant (admin), optional ?status=
exports.listReviews = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json({ status: "success", total: reviews.length, reviews });
});

// PATCH /reviews/:id/status  -> approve or reject a review (admin)
exports.updateReviewStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return next(new AppError("Invalid status.", 400));
  }
  const review = await Review.findOne({ _id: req.params.id });
  if (!review) return next(new AppError("Review not found", 404));

  review.status = status;
  await review.save();
  res.json({ status: "success", review });
});

// DELETE /reviews/:id  -> remove a review (admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id });
  if (!review) return next(new AppError("Review not found", 404));
  res.json({ status: "success" });
});
