const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * User model. A user belongs to ONE tenant (store).
 * The same email can exist across different tenants, so the unique index is
 * compound: { tenantId, email }.
 *
 * Note: password hashing/auth logic lives in the auth module.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    // Stored as a hash. Hashing handled in the auth service.
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "admin"], // admin = store owner/staff for THIS tenant
      default: "customer",
    },
    // Marks the original store owner. The owner can never be removed and is the
    // only admin allowed to manage users. Set automatically on provisioning.
    isOwner: { type: Boolean, default: false },
    // Customer profile: saved shipping details to prefill checkout next time.
    // Only meaningful for customers; admins don't use this.
    profile: {
      phone: { type: String, default: null },
      address: {
        line1: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        zip: { type: String, default: null },
        country: { type: String, default: null },
      },
    },
    // Customer wishlist: product IDs the customer saved (heart button).
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

// Apply tenant isolation (adds tenantId + auto-scopes queries).
userSchema.plugin(tenantPlugin);

// Email is unique PER tenant, not globally.
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
