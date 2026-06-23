const express = require('express');
const ctrl = require('../controllers/customer.controller');
const { protect, restrictTo } = require('../../auth/middlewares/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/', ctrl.listCustomers);
router.get('/:id', ctrl.getCustomer);

module.exports = router;
