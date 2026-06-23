const User = require('../../../models/User');
const Order = require('../../../models/Order');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Customer controllers (admin). All queries auto-scoped to the current tenant.
 *
 * Customers are Users with role 'customer'. For each we compute order stats
 * (total spent, order count, last order) via an aggregation over the Order
 * collection — useful for the marketing/CRM angle mentioned in the plan doc.
 */

// GET /customers  -> list customers with aggregated order stats
exports.listCustomers = catchAsync(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Aggregate order stats per customer for this tenant.
  // tenantId is enforced by the plugin on the find above, but aggregate()
  // bypasses query middleware, so we scope it explicitly here.
  const stats = await Order.aggregate([
    { $match: { tenantId: req.tenant._id, customer: { $ne: null } } },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 },
        lastOrder: { $max: '$createdAt' },
      },
    },
  ]);

  const statsMap = new Map(stats.map((s) => [String(s._id), s]));

  const enriched = customers.map((c) => {
    const s = statsMap.get(String(c._id));
    return {
      ...c,
      totalSpent: s?.totalSpent || 0,
      orderCount: s?.orderCount || 0,
      lastOrder: s?.lastOrder || null,
    };
  });

  res.json({ status: 'success', total: enriched.length, customers: enriched });
});

// GET /customers/:id  -> single customer with their orders
exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select(
    'name email createdAt'
  );
  if (!customer) return next(new AppError('Customer not found', 404));

  const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });
  res.json({ status: 'success', customer, orders });
});
