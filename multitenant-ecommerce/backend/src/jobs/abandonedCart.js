const cron = require("node-cron");
const Cart = require("../models/Cart");
const Tenant = require("../models/Tenant");
const { sendAbandonedCartEmail } = require("../services/email");
const { runWithTenant } = require("../plugins/tenantPlugin");
const { hasFeature } = require("../config/plans");
const logger = require("../config/logger");

/**
 * ============================================================================
 *  ABANDONED CART JOB
 * ============================================================================
 *
 * Periodically scans for carts that have been inactive for a while and still
 * have items, then emails the shopper a reminder (ONCE).
 *
 * A cart qualifies when:
 *   - status is 'active'
 *   - it has items
 *   - it has an email (logged-in user's or guest's checkout email)
 *   - lastActivityAt is older than ABANDONED_AFTER_MINUTES
 *
 * After sending, the cart is flipped to 'reminded' so we never re-send.
 *
 * Gated by plan: only tenants whose plan includes 'abandonedCart' get reminders.
 *
 * NOTE: this scans across tenants, so it runs OUTSIDE the per-request tenant
 * context. We read carts with the tenant filter explicit, and use runWithTenant
 * only where the isolation plugin needs a context.
 */

// Minutes of inactivity before a cart is "abandoned". Configurable via env.
const ABANDONED_AFTER_MINUTES = Number(process.env.ABANDONED_CART_MINUTES || 2);

// How often the job runs. Every minute by default (good for testing).
const CRON_SCHEDULE = process.env.ABANDONED_CART_CRON || "* * * * *";

async function processAbandonedCarts() {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60 * 1000);

  // Find candidate carts across all tenants (bypass tenant scoping here by
  // querying the raw model; we include tenantId in each doc to resolve later).
  // The tenant plugin scopes by context; with no context it won't auto-filter,
  // so this returns carts from every tenant.
  let carts;
  try {
    carts = await Cart.find({
      status: "active",
      lastActivityAt: { $lte: cutoff },
      email: { $ne: null },
      "items.0": { $exists: true }, // has at least one item
    }).limit(100);
  } catch (err) {
    logger.error({ err: err?.message }, "abandoned-cart: query failed");
    return;
  }

  if (!carts.length) return;

  logger.info({ count: carts.length }, "abandoned-cart: candidates found");

  for (const cart of carts) {
    try {
      // Load the tenant to check the plan + get the store name/url.
      const tenant = await Tenant.findById(cart.tenantId);
      if (!tenant) continue;

      // Plan gating: only 'abandonedCart'-enabled plans send reminders.
      if (!hasFeature(tenant.plan, "abandonedCart")) {
        // Mark as reminded anyway so we don't keep re-checking it forever.
        cart.status = "reminded";
        await cart.save();
        continue;
      }

      const storeUrl = process.env.PLATFORM_URL || "";

      await sendAbandonedCartEmail(cart, tenant.name, `${storeUrl}/store/cart`);

      // Flip to reminded so we never email this cart again.
      cart.status = "reminded";
      cart.remindedAt = new Date();
      await cart.save();

      logger.info(
        { cartId: cart._id, email: cart.email },
        "abandoned-cart: reminder sent",
      );
    } catch (err) {
      logger.error(
        { err: err?.message, cartId: cart._id },
        "abandoned-cart: failed for cart",
      );
    }
  }
}

// Schedule the job. Returns the task so the caller could stop it if needed.
function startAbandonedCartJob() {
  logger.info(
    { schedule: CRON_SCHEDULE, afterMinutes: ABANDONED_AFTER_MINUTES },
    "abandoned-cart job scheduled",
  );
  return cron.schedule(CRON_SCHEDULE, () => {
    processAbandonedCarts().catch((err) =>
      logger.error({ err: err?.message }, "abandoned-cart: tick failed"),
    );
  });
}

module.exports = { startAbandonedCartJob, processAbandonedCarts };
