const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Cart model. Persists a shopper's cart server-side so we can detect ABANDONED
 * carts and email a reminder (a Growth+ feature).
 *
 * Identity:
 *  - customer: set when the shopper is logged in.
 *  - email: captured from a logged-in user OR typed at checkout by a guest.
 * A cart needs an email to be "recoverable" (that's who we email).
 *
 * Lifecycle (status):
 *  - active:    being used / updated.
 *  - abandoned: untouched for a while with items still in it (set by the cron).
 *  - recovered: the shopper came back and completed the order.
 *  - reminded:  we already sent the abandoned-cart email (don't re-send).
 *
 * We key carts by customer when logged in, else by email, so a shopper has a
 * single rolling cart instead of dozens of rows.
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // snapshot, smallest currency unit
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: null },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: { type: String, default: null, lowercase: true, trim: true },
    items: { type: [cartItemSchema], default: [] },
    currency: { type: String, default: "ARS" },
    status: {
      type: String,
      enum: ["active", "abandoned", "recovered", "reminded"],
      default: "active",
    },
    // When we sent the reminder (for analytics / avoiding duplicates).
    remindedAt: { type: Date, default: null },
    // Last time the shopper touched this cart. Used to detect abandonment.
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

cartSchema.plugin(tenantPlugin);

// Fast lookup of a shopper's rolling cart.
cartSchema.index({ tenantId: 1, customer: 1 });
cartSchema.index({ tenantId: 1, email: 1 });
// The cron scans by status + activity time.
cartSchema.index({ tenantId: 1, status: 1, lastActivityAt: 1 });

module.exports = mongoose.model("Cart", cartSchema);
