const mongoose = require("mongoose");

/**
 * Tenant model.
 * Each tenant represents an independent store running on the platform.
 * The `slug` is what gets resolved from the subdomain (e.g. "store-a" in store-a.yourapp.com).
 *
 * IMPORTANT: This is the ONLY collection that does NOT carry a tenantId,
 * since it IS the source of truth for tenants themselves.
 */
const tenantSchema = new mongoose.Schema(
  {
    // Resolved from the subdomain. Must be unique and URL-safe.
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers and hyphens",
      ],
    },
    // Display name of the store.
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional custom domain mapped to this tenant (e.g. www.thestore.com).
    customDomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    // Basic per-tenant theming. Extend as needed for the MVP.
    theme: {
      primaryColor: { type: String, default: "#000000" },
      logoUrl: { type: String, default: null },
    },
    // Plan / billing info. Must match the plan ids in config/plans.js.
    plan: {
      type: String,
      enum: ["starter", "growth", "premium"],
      default: "starter",
    },
    // Allows suspending a tenant without deleting its data.
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    // MercadoPago credentials per tenant (each store collects its own payments).
    mercadoPago: {
      accessToken: { type: String, default: null },
      publicKey: { type: String, default: null },
    },
    // Shipping configuration (simple flat-rate model).
    shipping: {
      enabled: { type: Boolean, default: false },
      flatRate: { type: Number, default: 0 }, // cost in smallest currency unit (cents)
      freeThreshold: { type: Number, default: 0 }, // free shipping at/above this subtotal (0 = no free shipping)
    },
    // Homepage banner (configurable from the admin panel).
    banner: {
      enabled: { type: Boolean, default: true },
      imageUrl: { type: String, default: null },
      imageUrlMobile: { type: String, default: null },
      title: { type: String, default: null },
      subtitle: { type: String, default: null },
      ctaText: { type: String, default: null }, // button label
      ctaLink: { type: String, default: null }, // where the button goes
    },
    // Social links shown in the storefront footer (configurable from admin).
    social: {
      instagram: { type: String, default: null }, // username or full URL
      whatsapp: { type: String, default: null }, // phone number (digits only)
    },
    // "About us" content shown on the storefront /about page (configurable).
    about: {
      title: { type: String, default: null },
      body: { type: String, default: null },
    },
    // Feature banner (the Apple-style wide band on the home). Configurable on
    // Growth/Premium. The CTA always points to /store/categories. Falls back to
    // i18n defaults on the storefront when fields are empty.
    featureBanner: {
      eyebrow: { type: String, default: null },
      title: { type: String, default: null },
      subtitle: { type: String, default: null },
      ctaText: { type: String, default: null },
      imageUrl: { type: String, default: null }, // uploaded to Cloudinary
    },
    // Legal: copied from the PendingSignup when the tenant is provisioned, so we
    // keep a permanent record that the owner accepted the terms at signup.
    legal: {
      termsAccepted: { type: Boolean, default: false },
      termsAcceptedAt: { type: Date, default: null },
      termsVersion: { type: String, default: null },
      ipAddress: { type: String, default: null },
    },
    pages: {
      shipping: { type: String, default: null },
      returns: { type: String, default: null },
      terms: { type: String, default: null },
      privacy: { type: String, default: null },
    },
  },

  { timestamps: true },
);

// Fast lookups by slug and custom domain (used on every request by the resolver).
tenantSchema.index({ customDomain: 1 });

module.exports = mongoose.model("Tenant", tenantSchema);
