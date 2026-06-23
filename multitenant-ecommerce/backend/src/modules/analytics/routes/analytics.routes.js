const express = require('express');
const ctrl = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../../auth/middlewares/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/dashboard', ctrl.dashboard);
router.get('/summary', ctrl.summary);
router.get('/sales', ctrl.sales);
router.get('/by-channel', ctrl.byChannel);
router.get('/recent-orders', ctrl.recentOrders);
router.get('/low-stock', ctrl.lowStock);

module.exports = router;
