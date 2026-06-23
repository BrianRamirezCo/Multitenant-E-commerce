const express = require("express");
const ctrl = require("../controllers/product.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");
const { enforceLimit } = require("../../../middlewares/planGating");

const router = express.Router();

// Public storefront routes
router.get("/", ctrl.listProducts);
router.get("/:slug", ctrl.getProduct);

// Admin routes (protected)
router.use(protect, restrictTo("admin"));
// Enforce the plan's product limit on creation (e.g. Starter = 50 products).
router.post(
  "/",
  enforceLimit("products", ctrl.countProducts),
  ctrl.createProduct,
);
router.patch("/:id", ctrl.updateProduct);
router.delete("/:id", ctrl.deleteProduct);

module.exports = router;
