const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Order model. Each order belongs to one tenant and (optionally) one customer.
 * Line items snapshot the product name and price AT PURCHASE TIME, so later
 * price/name changes don't rewrite order history.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true }, // snapshot, smallest currency unit
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Guest contact info (the buyer may not have an account).
    contact: {
      email: { type: String, default: null },
      phone: { type: String, default: null },
    },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    // Subtotal before discount, and applied coupon info (if any).
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 }, // shipping added to the total (cents)
    couponCode: { type: String, default: null },
    currency: { type: String, default: "ARS" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "fulfilled"],
      default: "pending",
    },
    // Reference returned by MercadoPago to reconcile the payment.
    paymentRef: { type: String, default: null },
    shippingAddress: {
      fullName: String,
      line1: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    // Shipping/fulfillment info (managed by the store owner from the panel).
    shipping: {
      carrier: { type: String, default: null },
      trackingCode: { type: String, default: null },
      shippedAt: { type: Date, default: null },
    },
    // Flags whether stock was already decremented, so cancelling can restore it
    // exactly once and we never double-count.
    stockDecremented: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.plugin(tenantPlugin);

orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, customer: 1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
