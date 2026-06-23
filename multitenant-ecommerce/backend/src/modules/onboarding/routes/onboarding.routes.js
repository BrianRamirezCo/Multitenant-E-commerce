const express = require("express");
const ctrl = require("../controllers/onboarding.controller");
const { authLimiter } = require("../../../middlewares/rateLimiters");

/**
 * Onboarding routes — PLATFORM LEVEL (mounted OUTSIDE the tenant resolver).
 * These create tenants, so there is no current tenant context.
 *
 * NOTE: the webhook is intentionally NOT rate-limited — it's called by
 * MercadoPago, and limiting it could drop payment notifications.
 */
const router = express.Router();

router.get("/plans", ctrl.getPlans);
router.get("/check-slug", ctrl.checkSlug);
router.post("/signup", authLimiter, ctrl.signup); // strict: prevents signup abuse
router.get("/status", ctrl.signupStatus); // post-payment polling
router.post("/webhook", ctrl.webhook); // MercadoPago calls this — NO limiter

module.exports = router;
