const Tenant = require("../../../models/Tenant");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { encrypt, decrypt } = require("../../../utils/crypto");

/**
 * Tenant (store) management controllers.
 *
 * These run OUTSIDE the tenant context (they manage tenants themselves),
 * so they are NOT scoped by the isolation plugin. Protect these behind a
 * platform-level superadmin role, NOT a tenant admin.
 */

// POST /admin/tenants  -> provision a new store
exports.createTenant = catchAsync(async (req, res) => {
  const { slug, name, customDomain, plan } = req.body;
  const tenant = await Tenant.create({ slug, name, customDomain, plan });
  res.status(201).json({ status: "success", tenant });
});

// GET /admin/tenants  -> list all stores
exports.listTenants = catchAsync(async (req, res) => {
  const tenants = await Tenant.find().sort({ createdAt: -1 });
  res.json({ status: "success", total: tenants.length, tenants });
});

// PATCH /admin/tenants/:id  -> update store (theme, plan, status, MP credentials)
exports.updateTenant = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tenant) return next(new AppError("Tenant not found", 404));
  res.json({ status: "success", tenant });
});

// PATCH /admin/tenants/:id/suspend  -> suspend a store without deleting data
exports.suspendTenant = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    { status: "suspended" },
    { new: true },
  );
  if (!tenant) return next(new AppError("Tenant not found", 404));
  res.json({ status: "success", tenant });
});

// GET /tenant/me  -> public info about the CURRENT tenant (for the storefront)
exports.getCurrentTenant = catchAsync(async (req, res) => {
  // req.tenant is set by the resolver. Expose only public fields.
  const {
    _id,
    slug,
    name,
    theme,
    plan,
    shipping,
    banner,
    social,
    about,
    featureBanner,
  } = req.tenant;
  res.json({
    status: "success",
    tenant: {
      id: _id,
      slug,
      name,
      theme,
      plan,
      // Shipping config the storefront needs to compute the order total.
      shipping: shipping || { enabled: false, flatRate: 0, freeThreshold: 0 },
      // Homepage banner config the storefront renders.
      banner: banner || { enabled: true },
      // Social links + about content for the footer / about page.
      social: social || { instagram: null, whatsapp: null },
      about: about || { title: null, body: null },
      // Feature banner config the storefront renders (Growth+).
      featureBanner: featureBanner || {},
    },
  });
});

// PATCH /tenant/appearance  -> the STORE OWNER updates their own store's look.
// Runs inside the tenant context. Enforces plan rules server-side:
//   - the chosen theme must be allowed by the plan
//   - custom color only applies if the plan allows customColors
const { hasTheme, hasFeature } = require("../../../config/plans");

exports.updateAppearance = catchAsync(async (req, res, next) => {
  const tenant = req.tenant;
  const plan = tenant.plan;
  const { themeName, primaryColor, logoUrl } = req.body;

  // Validate theme against the plan.
  if (themeName) {
    if (!hasTheme(plan, themeName)) {
      return next(
        new AppError(
          "Your plan does not include this theme. Upgrade to unlock it.",
          403,
        ),
      );
    }
    tenant.theme.name = themeName;
  }

  // Custom color only if the plan allows it.
  if (primaryColor !== undefined) {
    if (primaryColor && !hasFeature(plan, "customColors")) {
      return next(
        new AppError("Custom colors are available on higher plans.", 403),
      );
    }
    // A null/empty value resets to the theme default.
    tenant.theme.primaryColor = primaryColor || null;
  }

  if (logoUrl !== undefined) {
    tenant.theme.logoUrl = logoUrl || null;
  }

  await tenant.save();

  const { _id, slug, name, theme } = tenant;
  res.json({ status: "success", tenant: { id: _id, slug, name, theme, plan } });
});

// GET /tenant/payment-settings  -> the store owner reads their MP config.
// Returns whether a token is set + a masked preview, NEVER the full token.
exports.getPaymentSettings = catchAsync(async (req, res) => {
  const mp = req.tenant.mercadoPago || {};
  // Token is stored encrypted at rest -> decrypt only to build the masked
  // preview (we never expose the full token to the client).
  const token = mp.accessToken ? decrypt(mp.accessToken) : null;
  res.json({
    status: "success",
    paymentSettings: {
      configured: Boolean(token),
      // Show only the last 4 chars so the owner can recognize it, never the full token.
      tokenPreview: token ? `••••••••${token.slice(-4)}` : null,
      publicKey: mp.publicKey || null,
    },
  });
});

// PATCH /tenant/payment-settings  -> the store owner saves their MP credentials.
// Runs inside the tenant context (the owner manages their OWN store).
exports.updatePaymentSettings = catchAsync(async (req, res) => {
  const tenant = req.tenant;
  const { accessToken, publicKey } = req.body;

  tenant.mercadoPago = tenant.mercadoPago || {};

  // Only overwrite the token if a non-empty value is provided (so saving other
  // fields doesn't wipe an existing token). An explicit empty string clears it.
  // The token is encrypted at rest (AES-256-GCM).
  if (accessToken !== undefined) {
    tenant.mercadoPago.accessToken = accessToken
      ? encrypt(accessToken.trim())
      : null;
  }
  if (publicKey !== undefined) {
    tenant.mercadoPago.publicKey = publicKey ? publicKey.trim() : null;
  }

  await tenant.save();

  // Decrypt only to build the masked preview returned to the client.
  const token = tenant.mercadoPago.accessToken
    ? decrypt(tenant.mercadoPago.accessToken)
    : null;
  res.json({
    status: "success",
    paymentSettings: {
      configured: Boolean(token),
      tokenPreview: token ? `••••••••${token.slice(-4)}` : null,
      publicKey: tenant.mercadoPago.publicKey || null,
    },
  });
});

// GET /tenant/shipping-settings  -> store owner reads their shipping config.
exports.getShippingSettings = catchAsync(async (req, res) => {
  const s = req.tenant.shipping || {
    enabled: false,
    flatRate: 0,
    freeThreshold: 0,
  };
  res.json({
    status: "success",
    shipping: {
      enabled: Boolean(s.enabled),
      flatRate: s.flatRate || 0,
      freeThreshold: s.freeThreshold || 0,
    },
  });
});

// PATCH /tenant/shipping-settings  -> store owner saves their shipping config.
// Amounts arrive in cents (the frontend converts pesos -> cents before sending).
exports.updateShippingSettings = catchAsync(async (req, res, next) => {
  const tenant = req.tenant;
  const { enabled, flatRate, freeThreshold } = req.body;

  tenant.shipping = tenant.shipping || {};
  if (enabled !== undefined) tenant.shipping.enabled = Boolean(enabled);
  if (flatRate !== undefined) {
    const n = Number(flatRate);
    if (Number.isNaN(n) || n < 0)
      return next(new AppError("Invalid shipping rate.", 400));
    tenant.shipping.flatRate = Math.round(n);
  }
  if (freeThreshold !== undefined) {
    const n = Number(freeThreshold);
    if (Number.isNaN(n) || n < 0)
      return next(new AppError("Invalid free-shipping threshold.", 400));
    tenant.shipping.freeThreshold = Math.round(n);
  }

  await tenant.save();
  res.json({
    status: "success",
    shipping: {
      enabled: Boolean(tenant.shipping.enabled),
      flatRate: tenant.shipping.flatRate || 0,
      freeThreshold: tenant.shipping.freeThreshold || 0,
    },
  });
});

// GET /tenant/banner-settings  -> store owner reads their banner config.
exports.getBannerSettings = catchAsync(async (req, res) => {
  const b = req.tenant.banner || {};
  res.json({
    status: "success",
    banner: {
      enabled: b.enabled !== false, // default true
      imageUrl: b.imageUrl || null,
      // Optional portrait crop for phones (falls back to imageUrl).
      imageUrlMobile: b.imageUrlMobile || null,
      title: b.title || "",
      subtitle: b.subtitle || "",
      ctaText: b.ctaText || "",
      ctaLink: b.ctaLink || "",
    },
  });
});

// PATCH /tenant/banner-settings  -> store owner saves their banner config.
exports.updateBannerSettings = catchAsync(async (req, res) => {
  const tenant = req.tenant;
  const {
    enabled,
    imageUrl,
    imageUrlMobile,
    title,
    subtitle,
    ctaText,
    ctaLink,
  } = req.body;

  tenant.banner = tenant.banner || {};
  if (enabled !== undefined) tenant.banner.enabled = Boolean(enabled);
  if (imageUrl !== undefined) tenant.banner.imageUrl = imageUrl || null;
  if (imageUrlMobile !== undefined)
    tenant.banner.imageUrlMobile = imageUrlMobile || null;
  if (title !== undefined) tenant.banner.title = title || null;
  if (subtitle !== undefined) tenant.banner.subtitle = subtitle || null;
  if (ctaText !== undefined) tenant.banner.ctaText = ctaText || null;
  if (ctaLink !== undefined) tenant.banner.ctaLink = ctaLink || null;

  await tenant.save();

  const b = tenant.banner;
  res.json({
    status: "success",
    banner: {
      enabled: b.enabled !== false,
      imageUrl: b.imageUrl || null,
      imageUrlMobile: b.imageUrlMobile || null,
      title: b.title || "",
      subtitle: b.subtitle || "",
      ctaText: b.ctaText || "",
      ctaLink: b.ctaLink || "",
    },
  });
});

// GET /tenant/store-settings  -> store owner reads social links + about content.
exports.getStoreSettings = catchAsync(async (req, res) => {
  const t = req.tenant;
  res.json({
    status: "success",
    settings: {
      social: t.social || { instagram: null, whatsapp: null },
      about: t.about || { title: null, body: null },
      featureBanner: t.featureBanner || {},
    },
  });
});

// PATCH /tenant/store-settings  -> store owner saves social links + about content.
exports.updateStoreSettings = catchAsync(async (req, res) => {
  const tenant = req.tenant;
  const { social, about, featureBanner } = req.body;

  tenant.social = tenant.social || {};
  tenant.about = tenant.about || {};
  tenant.featureBanner = tenant.featureBanner || {};

  if (social) {
    if (social.instagram !== undefined) {
      tenant.social.instagram = social.instagram?.trim() || null;
    }
    if (social.whatsapp !== undefined) {
      // Keep only digits for the WhatsApp number.
      tenant.social.whatsapp = social.whatsapp
        ? social.whatsapp.replace(/[^0-9]/g, "") || null
        : null;
    }
  }

  if (about) {
    if (about.title !== undefined)
      tenant.about.title = about.title?.trim() || null;
    if (about.body !== undefined)
      tenant.about.body = about.body?.trim() || null;
  }

  if (featureBanner) {
    const fb = featureBanner;
    if (fb.eyebrow !== undefined)
      tenant.featureBanner.eyebrow = fb.eyebrow?.trim() || null;
    if (fb.title !== undefined)
      tenant.featureBanner.title = fb.title?.trim() || null;
    if (fb.subtitle !== undefined)
      tenant.featureBanner.subtitle = fb.subtitle?.trim() || null;
    if (fb.ctaText !== undefined)
      tenant.featureBanner.ctaText = fb.ctaText?.trim() || null;
    if (fb.imageUrl !== undefined)
      tenant.featureBanner.imageUrl = fb.imageUrl || null;
  }

  await tenant.save();
  res.json({
    status: "success",
    settings: {
      social: tenant.social,
      about: tenant.about,
      featureBanner: tenant.featureBanner,
    },
  });
});
