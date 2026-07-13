const { Preference, Payment } = require("mercadopago");
const Order = require("../../../models/Order");
const Product = require("../../../models/Product");
const Tenant = require("../../../models/Tenant");
const Cart = require("../../../models/Cart");
const User = require("../../../models/User");
const {
  getClient,
  resolveAccessToken,
  tokenMode,
} = require("../services/mercadopago");
const {
  sendOrderConfirmationToCustomer,
  sendNewSaleToOwner,
} = require("../../../services/email");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const logger = require("../../../config/logger");

/**
 * ============================================================================
 *  PAYMENTS — MercadoPago Checkout Pro (order payments)
 * ============================================================================
 *
 * Flow:
 *   1. POST /payments/checkout  -> creates an MP "preference" for an order.
 *   2. Buyer pays on MercadoPago.
 *   3. POST /payments/webhook   -> MP notifies us; we fetch the payment, update
 *      the order status, decrement stock, and (on first approval) email the
 *      customer and the store owner.
 *
 * The webhook is PUBLIC (no tenant subdomain), so it resolves its tenant from
 * the query param + the order.
 */

// Helper: is this a real public URL (not localhost)? MercadoPago rejects
// localhost in back_urls / auto_return / notification_url.
function isPublicUrl(url) {
  return (
    /^https?:\/\//.test(url) &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  );
}

// POST /payments/checkout  -> create a payment preference for an order
exports.createPreference = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId });
  if (!order) return next(new AppError("Order not found", 404));
  if (order.status === "paid" || order.status === "fulfilled") {
    return next(new AppError("This order is already paid.", 409));
  }

  const client = getClient(req.tenant);
  if (!client) {
    return next(
      new AppError("This store has no payment method configured.", 400),
    );
  }

  // Log which credentials are in use so sandbox is never confused with prod.
  logger.info(
    {
      tenantSlug: req.tenant.slug,
      mpTokenMode: tokenMode(resolveAccessToken(req.tenant)),
    },
    "MP: creating preference",
  );

  const platformUrl = process.env.PLATFORM_URL || "http://localhost:5173";
  const apiUrl = process.env.API_URL || "http://localhost:5000";

  // Build the MP preference as a SINGLE item with the order's final total.
  // The backend already computed total = subtotal - discount + shipping, so
  // charging that exact amount honors coupons and shipping with no rounding
  // issues (MercadoPago doesn't accept negative line items for discounts).
  // Trade-off: the MP checkout shows one concept instead of an itemized list.
  const itemCount = order.items.reduce((n, it) => n + it.quantity, 0);
  const preferenceBody = {
    items: [
      {
        id: order._id.toString(),
        title: `Pedido en ${req.tenant.name}`,
        description: `${itemCount} producto(s)`,
        quantity: 1,
        unit_price: Math.round(order.total) / 100,
        currency_id: order.currency || "ARS",
      },
    ],
    external_reference: order._id.toString(),
  };

  // Only attach back_urls + auto_return when we have a PUBLIC url.
  if (isPublicUrl(platformUrl)) {
    preferenceBody.back_urls = {
      success: `${platformUrl}/store/checkout/success`,
      failure: `${platformUrl}/store/checkout/failure`,
      pending: `${platformUrl}/store/checkout/pending`,
    };
    preferenceBody.auto_return = "approved";
  }

  // Only attach the webhook URL when public (MercadoPago can't reach localhost).
  if (isPublicUrl(apiUrl)) {
    preferenceBody.notification_url = `${apiUrl}/api/payments/webhook?tenant=${req.tenant._id}`;
  }

  const preference = new Preference(client);
  let result;
  try {
    result = await preference.create({ body: preferenceBody });
  } catch (err) {
    logger.error(
      { err: err?.message, orderId },
      "MP preference creation failed",
    );
    return next(
      new AppError(
        "Could not create the payment. Check store credentials.",
        502,
      ),
    );
  }

  // Save the preference id on the order for reconciliation.
  order.paymentRef = result.id;
  await order.save();

  res.json({
    status: "success",
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  });
});

// POST /payments/webhook  -> MercadoPago payment notifications (PUBLIC)
exports.handleWebhook = catchAsync(async (req, res) => {
  const topic = req.query.type || req.body?.type;
  const paymentId = req.body?.data?.id || req.query["data.id"];
  const tenantId = req.query.tenant;

  // Only handle payment notifications.
  if (topic !== "payment" || !paymentId || !tenantId) {
    return res.sendStatus(200);
  }

  // Load the tenant to get its token (webhook has no subdomain context).
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    logger.warn({ tenantId }, "webhook: tenant not found");
    return res.sendStatus(200);
  }

  const client = getClient(tenant);
  if (!client) return res.sendStatus(200);

  // Fetch the real payment from MercadoPago to know its status.
  let payment;
  try {
    payment = await new Payment(client).get({ id: paymentId });
  } catch (err) {
    logger.error(
      { err: err?.message, paymentId },
      "webhook: failed to fetch payment",
    );
    return res.sendStatus(200);
  }

  const orderId = payment.external_reference;
  if (!orderId) return res.sendStatus(200);

  // Map MP status -> our order status.
  const statusMap = {
    approved: "paid",
    authorized: "paid",
    rejected: "failed",
    cancelled: "cancelled",
    refunded: "cancelled",
  };
  const newStatus = statusMap[payment.status];
  if (!newStatus) return res.sendStatus(200);

  // Update the order ONLY if it isn't already paid. The returned doc (before
  // update) tells us whether THIS call flipped it to paid, so we run the
  // side-effects (stock + emails) exactly once even if MercadoPago retries.
  const previous = await Order.findOneAndUpdate(
    { _id: orderId, tenantId: tenant._id, status: { $ne: "paid" } },
    { $set: { status: newStatus, paymentRef: String(paymentId) } },
  );

  if (!previous) {
    return res.sendStatus(200); // already paid (or not found) -> nothing to do
  }

  // First time this order becomes paid: decrement stock + send emails.
  if (newStatus === "paid") {
    // Decrement stock for each line item.
    for (const item of previous.items) {
      await Product.updateOne(
        { _id: item.product, tenantId: tenant._id },
        { $inc: { stock: -item.quantity } },
      ).catch((err) =>
        logger.error(
          { err: err?.message, product: item.product },
          "webhook: failed to decrement stock",
        ),
      );
    }
    // Mark the order so a later cancellation can restore stock exactly once.
    await Order.updateOne(
      { _id: orderId, tenantId: tenant._id },
      { $set: { stockDecremented: true } },
    ).catch(() => {});
    logger.info({ orderId }, "stock decremented for paid order");

    // Resolve the REAL owner of THIS tenant (multitenant-safe). The owner is the
    // User flagged isOwner within the tenant; there is no owner email on the
    // Tenant doc. No tenant context here (public webhook), so we pass tenantId
    // explicitly — the isolation plugin does not auto-filter without context.
    // Fall back to the global env only if we can't find one, so a misconfig
    // never silently drops the sale notification.
    let ownerEmail = process.env.STORE_OWNER_EMAIL || null;
    try {
      const owner = await User.findOne({
        tenantId: tenant._id,
        isOwner: true,
      })
        .select("email")
        .lean();
      if (owner?.email) {
        ownerEmail = owner.email;
      } else {
        logger.warn(
          { tenantId: String(tenant._id) },
          "webhook: tenant owner email not found, using STORE_OWNER_EMAIL fallback",
        );
      }
    } catch (err) {
      logger.warn(
        { err: err?.message, tenantId: String(tenant._id) },
        "webhook: owner lookup failed, using STORE_OWNER_EMAIL fallback",
      );
    }

    const storeBrand = {
      name: tenant.name,
      logoUrl: tenant.theme?.logoUrl || null,
    };

    // Send emails. The order is ALREADY paid at this point, so email problems
    // must never bubble up and turn into a non-200 (which would make MP retry
    // the whole webhook). Best-effort: log and continue.
    try {
      await sendOrderConfirmationToCustomer(previous, storeBrand);
      await sendNewSaleToOwner(previous, ownerEmail, tenant.name);
    } catch (err) {
      logger.error(
        { err: err?.message, orderId },
        "webhook: transactional emails failed (order already paid)",
      );
    }

    // Mark this shopper's cart as recovered so the abandoned-cart cron won't
    // email them. Match by customer (if any) or by the order's contact email.
    const cartFilter = { tenantId: tenant._id };
    if (previous.customer) {
      cartFilter.customer = previous.customer;
    } else if (previous.contact?.email) {
      cartFilter.email = previous.contact.email;
    }
    if (cartFilter.customer || cartFilter.email) {
      await Cart.updateOne(cartFilter, {
        $set: { status: "recovered", items: [], lastActivityAt: new Date() },
      }).catch(() => {});
    }
  }

  logger.info(
    { orderId, paymentStatus: payment.status, newStatus },
    "order updated from webhook",
  );
  res.sendStatus(200);
});
