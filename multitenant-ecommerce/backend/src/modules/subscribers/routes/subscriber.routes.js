const express = require("express");
const ctrl = require("../controllers/subscriber.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");

const router = express.Router();

// Public: subscribe from the storefront.
router.post("/", ctrl.subscribe);

// Admin: view the subscriber list.
router.get("/", protect, restrictTo("admin"), ctrl.listSubscribers);

module.exports = router;
