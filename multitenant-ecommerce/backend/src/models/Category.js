const mongoose = require('mongoose');
const { tenantPlugin } = require('../plugins/tenantPlugin');

/**
 * Category model. Organizes a tenant's catalog (skincare, tech, etc.).
 * The slug is unique per tenant. Products reference categories by slug (the
 * Product model keeps a `category` string), so categories are a lightweight
 * organizational layer without a hard foreign-key migration.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    // Optional image/icon for the storefront category nav.
    image: { type: String, default: null },
    // Display order in listings (lower = first).
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.plugin(tenantPlugin);

// Slug unique per tenant; index for ordered active listings.
categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
