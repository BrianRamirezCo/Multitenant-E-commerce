const express = require("express");
const ctrl = require("../controllers/review.controller");
const {
  protect,
  restrictTo,
  optionalAuth,
} = require("../../auth/middlewares/auth");

const router = express.Router();

/**
 * Review routes (tenant-scoped; mounted after the tenant resolver).
 *
 *  Public:
 *    GET  /reviews/product/:productId  -> approved reviews + average
 *
 *  Customer (logged in):
 *    POST /reviews                     -> create/update own review
 *    GET  /reviews/mine/:productId     -> own review for a product
 *
 *  Admin (moderation):
 *    GET    /reviews                   -> all reviews (optional ?status=)
 *    PATCH  /reviews/:id/status        -> approve / reject
 *    DELETE /reviews/:id               -> delete
 */

// Public: approved reviews for a product.
router.get("/product/:productId", ctrl.getProductReviews);

// Customer (must be logged in).
router.post("/", protect, ctrl.createReview);
router.get("/mine/:productId", protect, ctrl.getMyReview);

// Admin moderation.
router.get("/", protect, restrictTo("admin"), ctrl.listReviews);
router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  ctrl.updateReviewStatus,
);
router.delete("/:id", protect, restrictTo("admin"), ctrl.deleteReview);

module.exports = router;
