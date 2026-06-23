const Cart = require("../../../models/Cart");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Cart controllers. Persist a shopper's cart so the abandoned-cart cron can
 * email a reminder. All queries are auto-scoped to the current tenant.
 *
 * Identity resolution: prefer the logged-in customer; otherwise use the email.
 * A cart with neither can't be persisted (nothing to recover to), so we no-op.
 */

// Find the shopper's existing rolling cart (by customer, else by email).
async function findShopperCart(req, email) {
  if (req.user) {
    return Cart.findOne({ customer: req.user._id });
  }
  if (email) {
    return Cart.findOne({ email, customer: null });
  }
  return null;
}

// PUT /cart  -> create/update the shopper's cart (called as they shop)
exports.saveCart = catchAsync(async (req, res, next) => {
  const { items, email } = req.body;

  // Resolve the email: logged-in user's email wins, else the provided one.
  const resolvedEmail =
    req.user?.email || (email ? String(email).toLowerCase().trim() : null);

  // No identity at all -> can't persist a recoverable cart. Succeed silently.
  if (!req.user && !resolvedEmail) {
    return res.json({ status: "success", cart: null });
  }

  // Empty cart -> if one exists, clear it; otherwise nothing to do.
  if (!Array.isArray(items) || items.length === 0) {
    const existing = await findShopperCart(req, resolvedEmail);
    if (existing) {
      existing.items = [];
      existing.status = "active";
      existing.lastActivityAt = new Date();
      await existing.save();
    }
    return res.json({ status: "success", cart: null });
  }

  const normalizedItems = items.map((i) => ({
    product: i.product,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image || null,
  }));

  let cart = await findShopperCart(req, resolvedEmail);

  if (cart) {
    cart.items = normalizedItems;
    cart.email = resolvedEmail || cart.email;
    if (req.user) cart.customer = req.user._id;
    cart.status = "active"; // touching it makes it active again
    cart.remindedAt = null; // reset reminder if they came back and changed it
    cart.lastActivityAt = new Date();
    await cart.save();
  } else {
    cart = await Cart.create({
      tenantId: req.tenant._id,
      customer: req.user ? req.user._id : null,
      email: resolvedEmail,
      items: normalizedItems,
      status: "active",
      lastActivityAt: new Date(),
    });
  }

  res.json({ status: "success", cart });
});

// Mark a shopper's cart as recovered (called internally after a paid order).
// Exposed as a helper so the order/payment flow can call it.
exports.markRecovered = async (req) => {
  const email = req.user?.email || null;
  const cart = await findShopperCart(req, email);
  if (cart) {
    cart.status = "recovered";
    cart.items = [];
    cart.lastActivityAt = new Date();
    await cart.save();
  }
};
