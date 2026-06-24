const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Newsletter subscriber. One email per tenant (enforced by a compound unique
 * index on tenantId + email). Captured from the storefront newsletter section.
 * The owner can view/export the list from the admin (Growth feature).
 */
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Where the subscription came from (for future segmentation).
    source: { type: String, default: "storefront" },
  },
  { timestamps: true },
);

// tenantId + isolation scoping.
subscriberSchema.plugin(tenantPlugin);

// One subscription per email per store.
subscriberSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Subscriber", subscriberSchema);
