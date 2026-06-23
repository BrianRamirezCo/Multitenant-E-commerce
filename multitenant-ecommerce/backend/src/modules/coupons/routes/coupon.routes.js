const express = require('express');
const ctrl = require('../controllers/coupon.controller');
const { protect, restrictTo } = require('../../auth/middlewares/auth');
const { enforceLimit } = require('../../../middlewares/planGating');

const router = express.Router();

// Storefront: validate a coupon at checkout (public).
router.post('/validate', ctrl.validateCoupon);

// Admin routes.
router.get('/', protect, restrictTo('admin'), ctrl.listCoupons);
// Creation enforces the per-plan coupon limit.
router.post('/', protect, restrictTo('admin'), enforceLimit('coupons', ctrl.countCoupons), ctrl.createCoupon);
router.patch('/:id', protect, restrictTo('admin'), ctrl.updateCoupon);
router.delete('/:id', protect, restrictTo('admin'), ctrl.deleteCoupon);

module.exports = router;
