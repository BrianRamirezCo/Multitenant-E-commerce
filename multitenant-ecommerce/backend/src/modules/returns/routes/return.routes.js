const express = require("express");
const ctrl = require("../controllers/return.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");

const router = express.Router();

/**
 * Return (refund request) routes (tenant-scoped; after the tenant resolver).
 *
 * Customer (logged in):
 *   POST /returns         -> request a return for one of their paid orders
 *   GET  /returns/mine    -> their own return requests
 *
 * Admin:
 *   GET   /returns        -> list all returns (optional ?status=)
 *   PATCH /returns/:id    -> approve or reject
 */

// Customer endpoints (any logged-in user).
router.post("/", protect, ctrl.createReturn);
router.get("/mine", protect, ctrl.myReturns);

// Admin endpoints.
router.get("/", protect, restrictTo("admin"), ctrl.listReturns);
router.patch("/:id", protect, restrictTo("admin"), ctrl.resolveReturn);

module.exports = router;
