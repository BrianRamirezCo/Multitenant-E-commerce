const express = require("express");
const ctrl = require("../controllers/user.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");
const { enforceLimit } = require("../../../middlewares/planGating");

const router = express.Router();

/**
 * User management routes (tenant-scoped; mounted after the tenant resolver).
 * All admin-only: the store owner manages the admin users of their own store.
 */
router.get("/", protect, restrictTo("admin"), ctrl.listUsers);
// Enforce the plan's admin-user limit on creation (e.g. Starter = 1).
router.post(
  "/",
  protect,
  restrictTo("admin"),
  enforceLimit("adminUsers", ctrl.countUsers),
  ctrl.createUser,
);
router.delete("/:id", protect, restrictTo("admin"), ctrl.deleteUser);

module.exports = router;
