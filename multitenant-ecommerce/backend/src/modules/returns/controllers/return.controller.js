const Return = require("../../../models/Return");
const Order = require("../../../models/Order");
const Product = require("../../../models/Product");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const logger = require("../../../config/logger");

/**
 * Return (refund request) controllers. Tenant-scoped by the plugin.
 *
 * Customer: request a return for one of their PAID orders.
 * Admin: list all returns, approve (restores stock) or reject.
 *
 * Money refunds are handled MANUALLY by the owner in MercadoPago — approving
 * here only restores stock and marks the order returned.
 */

// POST /returns  -> a customer requests a return for a paid order
exports.createReturn = catchAsync(async (req, res, next) => {
  const { orderId, reason } = req.body;

  if (!orderId || !reason || !reason.trim()) {
    return next(new AppError("Order and reason are required.", 400));
  }

  // The order must exist and belong to THIS customer.
  const order = await Order.findOne({ _id: orderId });
  if (!order) return next(new AppError("Order not found", 404));

  // Ownership check: the requesting customer must own the order.
  if (
    !order.customer ||
    order.customer.toString() !== req.user._id.toString()
  ) {
    return next(new AppError("This order doesn't belong to you.", 403));
  }

  // Only paid/fulfilled orders can be returned.
  if (!["paid", "fulfilled"].includes(order.status)) {
    return next(new AppError("Only paid orders can be returned.", 400));
  }

  // Block a duplicate open/approved return for the same order.
  const existing = await Return.findOne({
    order: order._id,
    status: { $in: ["pending", "approved"] },
  });
  if (existing) {
    return next(
      new AppError("There's already a return request for this order.", 409),
    );
  }

  const ret = await Return.create({
    tenantId: req.tenant._id,
    order: order._id,
    customer: req.user._id,
    customerEmail: order.contact?.email || req.user.email || null,
    reason: reason.trim(),
    status: "pending",
  });

  res.status(201).json({ status: "success", return: ret });
});

// GET /returns/mine  -> the customer's own return requests
exports.myReturns = catchAsync(async (req, res) => {
  const returns = await Return.find({ customer: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ status: "success", total: returns.length, returns });
});

// GET /returns  -> admin: list all returns for the store
exports.listReturns = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  // Populate the order (for items/total) so the admin can review.
  const returns = await Return.find(filter)
    .sort({ createdAt: -1 })
    .populate("order");
  res.json({ status: "success", total: returns.length, returns });
});

// PATCH /returns/:id  -> admin approves or rejects a return
//   approve -> restore stock (once) + mark the order 'cancelled' (returned)
//   reject  -> just mark rejected
exports.resolveReturn = catchAsync(async (req, res, next) => {
  const { action, adminNote } = req.body; // action: 'approve' | 'reject'

  if (!["approve", "reject"].includes(action)) {
    return next(new AppError("Action must be 'approve' or 'reject'.", 400));
  }

  const ret = await Return.findOne({ _id: req.params.id });
  if (!ret) return next(new AppError("Return not found", 404));

  if (ret.status !== "pending") {
    return next(new AppError("This return was already resolved.", 409));
  }

  if (action === "reject") {
    ret.status = "rejected";
    ret.adminNote = adminNote?.trim() || null;
    ret.resolvedAt = new Date();
    await ret.save();
    return res.json({ status: "success", return: ret });
  }

  // ---- approve ----
  const order = await Order.findOne({ _id: ret.order });
  if (!order) return next(new AppError("Order not found", 404));

  // Restore stock once (guarded by stockRestored on the return).
  if (!ret.stockRestored) {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, tenantId: req.tenant._id },
        { $inc: { stock: item.quantity } },
      ).catch((err) =>
        logger.error(
          { err: err?.message, product: item.product },
          "return: failed to restore stock",
        ),
      );
    }
    ret.stockRestored = true;
    logger.info(
      { orderId: order._id, returnId: ret._id },
      "stock restored from return",
    );
  }

  // Mark the order as cancelled (returned) so it leaves the active sales flow.
  // Note its stock is already restored here, so we DON'T want the order's own
  // cancel path to restore it again — clear its stockDecremented flag.
  order.status = "cancelled";
  order.stockDecremented = false;
  await order.save();

  ret.status = "approved";
  ret.adminNote = adminNote?.trim() || null;
  ret.resolvedAt = new Date();
  await ret.save();

  res.json({ status: "success", return: ret });
});
