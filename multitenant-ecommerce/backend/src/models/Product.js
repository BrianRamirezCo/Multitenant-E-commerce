const mongoose = require("mongoose");
const { tenantPlugin } = require("../plugins/tenantPlugin");

/**
 * Product model. Each product belongs to one tenant's catalog.
 * The slug is unique per tenant (two different stores can both have "remera-negra").
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    // Price stored in the smallest currency unit (e.g. cents) to avoid float issues.
    price: { type: Number, required: true, min: 0 },
    // Original price (in cents) when the product is on sale. If set and higher
    // than `price`, the storefront shows it struck-through + a discount badge.
    compareAtPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: "ARS" },
    stock: { type: Number, default: 0, min: 0 },
    // Below this threshold the product is flagged as low stock in inventory.
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    images: [{ type: String }],
    category: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.plugin(tenantPlugin);

// Compound indexes: critical for query performance at scale.
productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
