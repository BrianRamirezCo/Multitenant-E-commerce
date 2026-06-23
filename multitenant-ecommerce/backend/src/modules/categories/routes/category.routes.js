const express = require("express");
const ctrl = require("../controllers/category.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");
const { enforceLimit } = require("../../../middlewares/planGating");

const router = express.Router();

// Public: storefront can list categories.
router.get("/", ctrl.listCategories);

// Admin: create/update/delete require auth.
// Enforce the plan's category limit on creation (e.g. Starter = 10).
router.post(
  "/",
  protect,
  restrictTo("admin"),
  enforceLimit("categories", ctrl.countCategories),
  ctrl.createCategory,
);
router.patch("/:id", protect, restrictTo("admin"), ctrl.updateCategory);
router.delete("/:id", protect, restrictTo("admin"), ctrl.deleteCategory);

module.exports = router;
