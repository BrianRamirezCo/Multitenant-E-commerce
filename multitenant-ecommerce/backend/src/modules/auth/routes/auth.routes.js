const express = require("express");
const ctrl = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth");
const { authLimiter } = require("../../../middlewares/rateLimiters");

/**
 * Auth routes (tenant-scoped). Mounted after the tenant resolver, so register
 * and login operate within the current store automatically.
 *
 * The strict authLimiter is applied to register/login/refresh to slow down
 * brute-force and credential-stuffing attempts.
 */
const router = express.Router();

router.post("/register", authLimiter, ctrl.register);
router.post("/login", authLimiter, ctrl.login);
router.post("/refresh", authLimiter, ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.patch("/profile", protect, ctrl.updateProfile);

module.exports = router;
