const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Return (refund request) model. A customer requests to return a PAID order;
 * the store owner approves or rejects it.
 *
 * On approval: stock is restored and the order is marked returned. The actual
 * money refund is done MANUALLY by the owner in their MercadoPago panel (we
 * don't call MP refunds automatically — that's a future enhancement).
 *
 * One pending/approved return per order (you can't request twice for the same
 * order while one is open).
 */
const returnSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    // Who requested it (the customer). Snapshot the email for guest-less display.
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerEmail: { type: String, default: null }, // snapshot from the order
    // Customer's reason for the return.
    reason: { type: String, required: true },
    // Lifecycle: pending -> approved | rejected.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Optional note the admin leaves when resolving (e.g. why rejected).
    adminNote: { type: String, default: null },
    // When the admin resolved it.
    resolvedAt: { type: Date, default: null },
    // Flags whether stock was already restored, so approving is idempotent.
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

returnSchema.plugin(tenantPlugin);

returnSchema.index({ tenantId: 1, status: 1 });
returnSchema.index({ tenantId: 1, order: 1 });
returnSchema.index({ tenantId: 1, customer: 1 });

module.exports = mongoose.model("Return", returnSchema);
