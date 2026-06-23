const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');

/**
 * ============================================================================
 *  ANALYTICS CONTROLLERS  --  REAL DATA (MongoDB aggregations)
 * ============================================================================
 *
 * Replaces the frontend MOCK_DASHBOARD. Every aggregation is scoped to the
 * current tenant via { tenantId: req.tenant._id } in the $match stage.
 *
 * IMPORTANT: aggregate() bypasses Mongoose query middleware, so the tenant
 * isolation plugin does NOT auto-inject tenantId here. We MUST add it manually
 * to every $match — forgetting it would leak cross-tenant data. This is the one
 * place where the "never write tenantId by hand" rule has an exception, so it
 * gets extra care.
 *
 * Endpoints:
 *   GET /analytics/summary            -> KPI cards (+ deltas vs previous period)
 *   GET /analytics/sales?days=7       -> sales time series
 *   GET /analytics/by-channel         -> sales grouped by source (placeholder)
 *   GET /analytics/recent-orders      -> latest orders
 *   GET /analytics/low-stock          -> products under their min threshold
 *   GET /analytics/dashboard          -> all of the above in one call
 */

const PAID_STATUSES = ['paid', 'fulfilled'];

/** Sum of order totals + count within a date range for the tenant. */
async function salesInRange(tenantId, from, to) {
  const result = await Order.aggregate([
    {
      $match: {
        tenantId,
        status: { $in: PAID_STATUSES },
        createdAt: { $gte: from, $lt: to },
      },
    },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  return result[0] || { total: 0, count: 0 };
}

function pctDelta(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// GET /analytics/summary
exports.summary = catchAsync(async (req, res) => {
  const tenantId = req.tenant._id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 864e5);

  const [thisWeek, lastWeek, totalOrders, newCustomers, prevCustomers, productsSold] =
    await Promise.all([
      salesInRange(tenantId, weekAgo, now),
      salesInRange(tenantId, twoWeeksAgo, weekAgo),
      Order.countDocuments({ tenantId, status: { $in: PAID_STATUSES } }),
      User.countDocuments({ tenantId, role: 'customer', createdAt: { $gte: weekAgo } }),
      User.countDocuments({
        tenantId,
        role: 'customer',
        createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      }),
      Order.aggregate([
        { $match: { tenantId, status: { $in: PAID_STATUSES } } },
        { $unwind: '$items' },
        { $group: { _id: null, qty: { $sum: '$items.quantity' } } },
      ]),
    ]);

  const avgTicket = thisWeek.count ? Math.round(thisWeek.total / thisWeek.count) : 0;
  const prevAvg = lastWeek.count ? Math.round(lastWeek.total / lastWeek.count) : 0;

  res.json({
    status: 'success',
    summary: {
      totalSales: thisWeek.total,
      orders: thisWeek.count,
      newCustomers,
      avgTicket,
      productsSold: productsSold[0]?.qty || 0,
      totalOrdersAllTime: totalOrders,
      deltas: {
        totalSales: pctDelta(thisWeek.total, lastWeek.total),
        orders: pctDelta(thisWeek.count, lastWeek.count),
        newCustomers: pctDelta(newCustomers, prevCustomers),
        avgTicket: pctDelta(avgTicket, prevAvg),
      },
    },
  });
});

// GET /analytics/sales?days=7
exports.sales = catchAsync(async (req, res) => {
  const tenantId = req.tenant._id;
  const days = Math.min(parseInt(req.query.days || '7', 10), 90);
  const from = new Date(Date.now() - days * 864e5);

  const series = await Order.aggregate([
    { $match: { tenantId, status: { $in: PAID_STATUSES }, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        value: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    status: 'success',
    series: series.map((s) => ({ day: s._id, value: s.value })),
  });
});

// GET /analytics/by-channel
// NOTE: orders don't yet store a "source" field, so this groups by a placeholder.
// Add a `source` field to the Order model when you track acquisition channels,
// then group by it here. For now returns online-only.
exports.byChannel = catchAsync(async (req, res) => {
  const tenantId = req.tenant._id;
  const result = await salesInRange(tenantId, new Date(Date.now() - 30 * 864e5), new Date());
  res.json({
    status: 'success',
    channels: [{ name: 'Tienda online', value: 100, total: result.total }],
  });
});

// GET /analytics/recent-orders
exports.recentOrders = catchAsync(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name')
    .lean();
  res.json({ status: 'success', orders });
});

// GET /analytics/low-stock
exports.lowStock = catchAsync(async (req, res) => {
  // Products with stock below a threshold (default 10). The plugin scopes this.
  const threshold = parseInt(req.query.threshold || '10', 10);
  const products = await Product.find({ stock: { $lt: threshold } })
    .select('name stock')
    .sort({ stock: 1 })
    .limit(10)
    .lean();
  res.json({ status: 'success', products });
});

// GET /analytics/dashboard  -> everything in one round-trip
exports.dashboard = catchAsync(async (req, res) => {
  // Reuse the handlers by calling their logic inline would duplicate code;
  // instead we run the pieces in parallel here.
  const tenantId = req.tenant._id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 864e5);

  const [thisWeek, lastWeek, productsSold, salesSeries, recent, low, newCustomers] =
    await Promise.all([
      salesInRange(tenantId, weekAgo, now),
      salesInRange(tenantId, twoWeeksAgo, weekAgo),
      Order.aggregate([
        { $match: { tenantId, status: { $in: PAID_STATUSES } } },
        { $unwind: '$items' },
        { $group: { _id: null, qty: { $sum: '$items.quantity' } } },
      ]),
      Order.aggregate([
        { $match: { tenantId, status: { $in: PAID_STATUSES }, createdAt: { $gte: new Date(Date.now() - 7 * 864e5) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name').lean(),
      Product.find({ stock: { $lt: 10 } }).select('name stock').sort({ stock: 1 }).limit(10).lean(),
      User.countDocuments({ tenantId, role: 'customer', createdAt: { $gte: weekAgo } }),
    ]);

  const avgTicket = thisWeek.count ? Math.round(thisWeek.total / thisWeek.count) : 0;

  res.json({
    status: 'success',
    dashboard: {
      kpis: {
        totalSales: thisWeek.total,
        orders: thisWeek.count,
        newCustomers,
        avgTicket,
        productsSold: productsSold[0]?.qty || 0,
        deltas: {
          totalSales: pctDelta(thisWeek.total, lastWeek.total),
          orders: pctDelta(thisWeek.count, lastWeek.count),
          newCustomers: 0,
          avgTicket: 0,
          productsSold: 0,
        },
      },
      salesSeries: salesSeries.map((s) => ({ day: s._id, value: s.value })),
      byChannel: [{ name: 'Tienda online', value: 100, color: '#7c3aed' }],
      recentOrders: recent,
      lowStock: low,
    },
  });
});
