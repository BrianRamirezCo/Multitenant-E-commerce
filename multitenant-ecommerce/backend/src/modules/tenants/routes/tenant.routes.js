const express = require("express");
const ctrl = require("../controllers/tenant.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");

/**
 * Two distinct routers:
 *  - adminRouter: platform superadmin operations (provision/suspend stores).
 *    Mounted OUTSIDE the tenant resolver. Protect with a superadmin guard.
 *  - publicRouter: storefront-facing info about the current tenant.
 *    Mounted INSIDE the tenant resolver (req.tenant is available).
 */

const adminRouter = express.Router();
// adminRouter.use(protectSuperadmin); // implement a platform-level guard
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

module.exports = { adminRouter, publicRouter };
