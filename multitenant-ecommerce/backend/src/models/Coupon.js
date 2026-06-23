const mongoose = require('mongoose');
const { tenantPlugin } = require('../plugins/tenantPlugin');

/**
 * Coupon model. Discount codes a store offers (e.g. BIENVENIDA10, HOTSALE).
 *
 * Discount types:
 *   - 'percentage': value is a percent (e.g. 10 = 10% off)
 *   - 'fixed': value is an amount in cents off the order total
 *
 * Optional constraints: min purchase, usage limit, expiry, active flag.
 * usedCount tracks redemptions for the usage limit.
 */
const couponSchema = new mongoose.Schema(
  {
    // Stored uppercase for case-insensitive matching at checkout.
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    // Minimum order total (cents) required to use the coupon. 0 = no minimum.
    minPurchase: { type: Number, default: 0, min: 0 },
    // Max total redemptions. null = unlimited.
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
    // Optional expiry date. null = no expiry.
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.plugin(tenantPlugin);

// Code unique per tenant (two stores can both have "WELCOME10").
couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

/**
 * Returns { valid, reason, discount } for a given order subtotal (cents).
 * Pure helper; does not mutate or persist.
 */
couponSchema.methods.evaluate = function (subtotalCents) {
  if (!this.isActive) return { valid: false, reason: 'inactive' };
  if (this.expiresAt && this.expiresAt < new Date()) return { valid: false, reason: 'expired' };
  if (this.usageLimit != null && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'usage_limit_reached' };
  }
  if (subtotalCents < this.minPurchase) return { valid: false, reason: 'min_purchase' };

  const discount =
    this.type === 'percentage'
      ? Math.round((subtotalCents * this.value) / 100)
      : Math.min(this.value, subtotalCents);

  return { valid: true, discount };
};

module.exports = mongoose.model('Coupon', couponSchema);
