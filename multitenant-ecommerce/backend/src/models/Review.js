const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Review model. A customer leaves ONE review per product (enforced by a compound
 * unique index). Reviews start as 'pending' and only show in the storefront once
 * an admin sets them to 'approved'.
 *
 * `verifiedPurchase` flags whether the reviewer actually bought the product
 * (computed at creation time). Not used to gate reviewing right now, but stored
 * so we can show a "verified" badge later.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Snapshot of the reviewer's name, so we don't need to populate on read.
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.plugin(tenantPlugin);

// One review per customer per product (within a tenant).
reviewSchema.index({ tenantId: 1, product: 1, customer: 1 }, { unique: true });
// Fast lookups of approved reviews for a product.
reviewSchema.index({ tenantId: 1, product: 1, status: 1 });

module.exports = mongoose.model("Review", reviewSchema);
