const mongoose = require("mongoose");
/**
 * PendingSignup holds a paid-plan signup intent between the moment the user
 * starts checkout and the moment MercadoPago confirms the subscription.
 *
 * When the subscription webhook fires with an authorized status, we look up the
 * pending signup by externalReference and provision the tenant + owner.
 *
 * This is a PLATFORM-level collection (no tenantId): the tenant doesn't exist
 * yet at this stage.
 *
 * The ownerPasswordHash is already bcrypt-hashed before being stored here.
 * A TTL index auto-deletes stale, never-completed signups after 24h.
 */
const pendingSignupSchema = new mongoose.Schema(
  {
    externalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: { type: String, required: true },
    storeName: { type: String, required: true },
    plan: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    ownerPasswordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    preapprovalId: { type: String, default: null },

    // Legal: record that the owner accepted the terms at signup time.
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date, default: null },
    termsVersion: { type: String, default: "1.0" },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true },
);
// Auto-expire pending (uncompleted) signups after 24h to keep the slug free.
pendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
