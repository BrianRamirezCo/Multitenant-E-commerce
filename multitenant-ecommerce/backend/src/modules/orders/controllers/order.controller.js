const Order = require("../../../models/Order");
const Product = require("../../../models/Product");
const Coupon = require("../../../models/Coupon");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const logger = require("../../../config/logger");

/**
 * Order controllers. All queries are auto-scoped to the current tenant.
 */

// POST /orders  -> create an order from a cart (validates stock & recomputes total server-side)
exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, shippingAddress, couponCode, contact } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  // Validate essential customer data server-side (don't trust the client).
  // Required: full name, email, and a shipping address line.
  const fullName = shippingAddress?.fullName?.trim();
  const email = contact?.email?.trim();
  const addressLine = shippingAddress?.line1?.trim();

  if (!fullName || !email || !addressLine) {
    return next(new AppError("Name, email and address are required.", 400));
  }
  // Basic email format check.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError("A valid email is required.", 400));
  }

  // Re-fetch products from DB to trust prices server-side (never trust client prices).
  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const orderItems = items.map((i) => {
    const product = productMap.get(i.product);
    if (!product) throw new AppError(`Product ${i.product} not found`, 404);
    if (product.stock < i.quantity) {
      throw new AppError(`Not enough stock for ${product.name}`, 400);
    }
    subtotal += product.price * i.quantity;
    return {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: i.quantity,
    };
  });

  // Apply a coupon if provided. The discount is recomputed server-side from the
  // real subtotal — never trust a discount sent by the client.
  let discount = 0;
  let appliedCode = null;
  let couponDoc = null;
  if (couponCode) {
    couponDoc = await Coupon.findOne({
      code: String(couponCode).toUpperCase().trim(),
    });
    if (couponDoc) {
      const result = couponDoc.evaluate(subtotal);
      if (result.valid) {
        discount = result.discount;
        appliedCode = couponDoc.code;
      }
      // If invalid, we silently ignore it (order proceeds without discount).
      // The storefront validates before submit, so this is a safety net.
    }
  }

  // Amount after discount (before shipping).
  const afterDiscount = Math.max(0, subtotal - discount);

  // Compute shipping from the tenant's config (server-side, never trust client).
  // If enabled: free when afterDiscount reaches freeThreshold (and it's > 0),
  // otherwise the flat rate. If disabled: no shipping cost.
  let shippingCost = 0;
  const shipCfg = req.tenant.shipping || {};
  if (shipCfg.enabled) {
    const freeThreshold = shipCfg.freeThreshold || 0;
    const qualifiesFree = freeThreshold > 0 && afterDiscount >= freeThreshold;
    shippingCost = qualifiesFree ? 0 : shipCfg.flatRate || 0;
  }

  const total = afterDiscount + shippingCost;

  const order = await Order.create({
    tenantId: req.tenant._id,
    customer: req.user ? req.user._id : null,
    contact: { email, phone: contact?.phone?.trim() || null },
    items: orderItems,
    subtotal,
    discount,
    shippingCost,
    couponCode: appliedCode,
    total,
    shippingAddress,
    status: "pending",
  });

  // Register coupon redemption (best-effort; doesn't block the order).
  if (couponDoc && appliedCode) {
    await Coupon.updateOne(
      { _id: couponDoc._id },
      { $inc: { usedCount: 1 } },
    ).catch(() => {});
  }

  res.status(201).json({ status: "success", order });
});

// GET /orders  -> list orders (admin sees all tenant orders; customer sees their own)
exports.listOrders = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user && req.user.role !== "admin") {
    filter.customer = req.user._id;
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ status: "success", total: orders.length, orders });
});

// GET /orders/:id
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id });
  if (!order) return next(new AppError("Order not found", 404));
  res.json({ status: "success", order });
});

// PATCH /orders/:id/status  -> admin updates the order status and/or shipping info
// Cancelling a PAID order restores stock (once, guarded by stockDecremented).
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, shipping } = req.body;

  const VALID = ["pending", "paid", "failed", "cancelled", "fulfilled"];
  if (status && !VALID.includes(status)) {
    return next(new AppError("Invalid status.", 400));
  }

  const order = await Order.findOne({ _id: req.params.id });
  if (!order) return next(new AppError("Order not found", 404));

  // If we're cancelling an order whose stock was decremented, restore it once.
  const isCancelling = status === "cancelled" && order.status !== "cancelled";
  if (isCancelling && order.stockDecremented) {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, tenantId: req.tenant._id },
        { $inc: { stock: item.quantity } },
      ).catch((err) =>
        logger.error(
          { err: err?.message, product: item.product },
          "failed to restore stock on cancel",
        ),
      );
    }
    order.stockDecremented = false;
    logger.info({ orderId: order._id }, "stock restored on cancel");
  }

  // Apply status change.
  if (status) order.status = status;

  // Apply shipping info if provided (carrier / trackingCode). Setting a tracking
  // code stamps shippedAt and moves the order to "fulfilled" if it was paid.
  if (shipping) {
    order.shipping = order.shipping || {};
    if (shipping.carrier !== undefined)
      order.shipping.carrier = shipping.carrier;
    if (shipping.trackingCode !== undefined) {
      order.shipping.trackingCode = shipping.trackingCode;
      if (shipping.trackingCode) {
        order.shipping.shippedAt = new Date();
        if (order.status === "paid") order.status = "fulfilled";
      }
    }
  }

  await order.save();
  res.json({ status: "success", order });
});
