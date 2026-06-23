const express = require("express");
const ctrl = require("../controllers/order.controller");
const {
  protect,
  restrictTo,
  optionalAuth,
} = require("../../auth/middlewares/auth");

const router = express.Router();

// Public: the storefront checkout creates orders without requiring an account
// (guest checkout). The controller already handles customer = null.
router.post("/", optionalAuth, ctrl.createOrder);

// Protected: listing orders and viewing a single order are admin/account actions.
router.get("/", protect, ctrl.listOrders);
router.get("/:id", protect, ctrl.getOrder);

// Admin only: update status / shipping info.
router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  ctrl.updateOrderStatus,
);

module.exports = router;
