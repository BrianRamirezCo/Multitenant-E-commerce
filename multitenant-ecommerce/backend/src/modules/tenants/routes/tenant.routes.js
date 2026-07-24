const express = require("express");
const ctrl = require("../controllers/tenant.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");
const AppError = require("../../../utils/AppError");
/**
 * Two distinct routers:
 *  - adminRouter: platform superadmin operations (provision/suspend stores).
 *    Mounted OUTSIDE the tenant resolver. Protect with a superadmin guard.
 *  - publicRouter: storefront-facing info about the current tenant.
 *    Mounted INSIDE the tenant resolver (req.tenant is available).
 */

/**
 * Platform-level guard. These routes manage TENANTS THEMSELVES (list every
 * store, change plans, overwrite MercadoPago credentials, suspend a store), so
 * they must never be reachable by a store admin — let alone anonymously.
 *
 * Until there's a proper superadmin role, this is a shared secret in a header.
 * If PLATFORM_ADMIN_KEY is not set, the routes are DENIED (fail closed): an
 * unset env must never mean "wide open".
 */
function protectPlatformAdmin(req, res, next) {
  const expected = process.env.PLATFORM_ADMIN_KEY;
  if (!expected) {
    return next(new AppError("Platform admin API is not configured.", 503));
  }
  const provided = req.headers["x-platform-key"];
  if (!provided || provided !== expected) {
    return next(new AppError("Not authorized.", 401));
  }
  next();
}

const adminRouter = express.Router();
adminRouter.use(protectPlatformAdmin);
adminRouter.post("/", ctrl.createTenant);
adminRouter.get("/", ctrl.listTenants);
adminRouter.patch("/:id", ctrl.updateTenant);
adminRouter.patch("/:id/suspend", ctrl.suspendTenant);

const publicRouter = express.Router();
publicRouter.get("/me", ctrl.getCurrentTenant);
// The store owner updates their own store's appearance (theme/color/logo).
publicRouter.patch(
  "/appearance",
  protect,
  restrictTo("admin"),
  ctrl.updateAppearance,
);
// The store owner manages their own MercadoPago credentials.
publicRouter.get(
  "/payment-settings",
  protect,
  restrictTo("admin"),
  ctrl.getPaymentSettings,
);
publicRouter.patch(
  "/payment-settings",
  protect,
  restrictTo("admin"),
  ctrl.updatePaymentSettings,
);
publicRouter.get(
  "/shipping-settings",
  protect,
  restrictTo("admin"),
  ctrl.getShippingSettings,
);
publicRouter.patch(
  "/shipping-settings",
  protect,
  restrictTo("admin"),
  ctrl.updateShippingSettings,
);
publicRouter.get(
  "/banner-settings",
  protect,
  restrictTo("admin"),
  ctrl.getBannerSettings,
);
publicRouter.patch(
  "/banner-settings",
  protect,
  restrictTo("admin"),
  ctrl.updateBannerSettings,
);
// The store owner manages their social links + "About us" content.
publicRouter.get(
  "/store-settings",
  protect,
  restrictTo("admin"),
  ctrl.getStoreSettings,
);
publicRouter.patch(
  "/store-settings",
  protect,
  restrictTo("admin"),
  ctrl.updateStoreSettings,
);
// The store owner writes the copy of their storefront info pages
// (shipping, returns, terms, privacy).
publicRouter.get("/pages", protect, restrictTo("admin"), ctrl.getPages);
publicRouter.patch("/pages", protect, restrictTo("admin"), ctrl.updatePages);

module.exports = { adminRouter, publicRouter };
