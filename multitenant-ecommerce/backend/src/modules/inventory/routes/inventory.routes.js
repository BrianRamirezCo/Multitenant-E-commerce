const express = require('express');
const ctrl = require('../controllers/inventory.controller');
const { protect, restrictTo } = require('../../auth/middlewares/auth');

const router = express.Router();

// Admin only.
router.get('/', protect, restrictTo('admin'), ctrl.getInventory);
router.patch('/:id', protect, restrictTo('admin'), ctrl.updateStock);

module.exports = router;
