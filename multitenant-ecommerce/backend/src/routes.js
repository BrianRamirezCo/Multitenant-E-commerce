const express = require("express");
const { tenantResolver } = require("./middlewares/tenantResolver");
const onboardingRoutes = require("./modules/onboarding/routes/onboarding.routes");
const {
  adminRouter: tenantAdminRouter,
  publicRouter: tenantPublicRouter,
} = require("./modules/tenants/routes/tenant.routes");
const authRoutes = require("./modules/auth/routes/auth.routes");
const productRoutes = require("./modules/products/routes/product.routes");
const orderRoutes = require("./modules/orders/routes/order.routes");
const {
  tenantRouter: paymentTenantRoutes,
  webhookRouter: paymentWebhookRoutes,
} = require("./modules/payments/routes/payment.routes");
const customerRoutes = require("./modules/customers/routes/customer.routes");
const analyticsRoutes = require("./modules/analytics/routes/analytics.routes");
const categoryRoutes = require("./modules/categories/routes/category.routes");
const couponRoutes = require("./modules/coupons/routes/coupon.routes");
const inventoryRoutes = require("./modules/inventory/routes/inventory.routes");
const reviewRoutes = require("./modules/reviews/routes/review.routes");
const cartRoutes = require("./modules/cart/routes/cart.routes");
const userRoutes = require("./modules/users/routes/user.routes");
const returnRoutes = require("./modules/returns/routes/return.routes");
const uploadRoutes = require("./modules/uploads/routes/upload.routes");
/**
 * Central API router.
 *
 * CRITICAL ORDERING:
 *  - Platform-level routes (/admin/tenants) are mounted WITHOUT the tenant
 *    resolver, because they manage tenants themselves.
 *  - Everything else is mounted AFTER tenantResolver, so req.tenant is set and
 *    the isolation plugin auto-scopes all queries.
 */
const router = express.Router();

// --- Platform superadmin (NO tenant context) ---
router.use("/admin/tenants", tenantAdminRouter);
router.use("/onboarding", onboardingRoutes);
router.use("/payments", paymentWebhookRoutes);

// --- Tenant-scoped API (tenant context opened here) ---
const tenantApi = express.Router();
tenantApi.use(tenantResolver());
tenantApi.use("/tenant", tenantPublicRouter);
tenantApi.use("/auth", authRoutes);
tenantApi.use("/products", productRoutes);
tenantApi.use("/orders", orderRoutes);
tenantApi.use("/customers", customerRoutes);
tenantApi.use("/analytics", analyticsRoutes);
tenantApi.use("/categories", categoryRoutes);
tenantApi.use("/coupons", couponRoutes);
tenantApi.use("/inventory", inventoryRoutes);
tenantApi.use("/reviews", reviewRoutes);
tenantApi.use("/cart", cartRoutes);
tenantApi.use("/users", userRoutes);
tenantApi.use("/returns", returnRoutes);
tenantApi.use("/uploads", uploadRoutes);
tenantApi.use("/payments", paymentTenantRoutes);
router.use("/", tenantApi);

module.exports = router;
