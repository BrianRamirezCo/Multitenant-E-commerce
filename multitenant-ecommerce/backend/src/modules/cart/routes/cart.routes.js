const express = require("express");
const ctrl = require("../controllers/cart.controller");
const { optionalAuth } = require("../../auth/middlewares/auth");

const router = express.Router();

/**
 * Cart routes (tenant-scoped; mounted after the tenant resolver).
 *
 * PUT /cart  -> save/update the shopper's cart. PUBLIC with optionalAuth:
 *   - logged-in shoppers are identified by their account (req.user)
 *   - guests are identified by the email they provide in the body
 * This powers the abandoned-cart reminder (Growth+).
 */
router.put("/", optionalAuth, ctrl.saveCart);

module.exports = router;
