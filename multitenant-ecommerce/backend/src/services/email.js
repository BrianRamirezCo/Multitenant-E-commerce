const { Resend } = require("resend");
const logger = require("../config/logger");

/**
 * Email service (Resend).
 *
 * Centralizes all outgoing email. If RESEND_API_KEY is not configured, calls
 * become no-ops (logged) so the app never crashes for a missing email setup.
 *
 * In production, set EMAIL_FROM to an address on a domain verified in Resend.
 * While testing with the Resend sandbox (onboarding@resend.dev), Resend only
 * delivers to the account owner's email.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

function money(cents, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

/**
 * Low-level send. Swallows errors (logs them) so a failed email never breaks
 * the payment flow — the order is already paid; email is best-effort.
 */
async function sendEmail({ to, subject, html }) {
  if (!resend) {
    logger.warn({ to, subject }, "email skipped: RESEND_API_KEY not set");
    return;
  }
  if (!to) {
    logger.warn({ subject }, "email skipped: no recipient");
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      logger.error({ err: error, to, subject }, "email send failed");
    } else {
      logger.info({ to, subject }, "email sent");
    }
  } catch (err) {
    logger.error({ err: err?.message, to, subject }, "email send threw");
  }
}

/** Builds the shared HTML for the order items table. */
function itemsTable(order) {
  const rows = order.items
    .map(
      (it) =>
        `<tr>
           <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.name} × ${it.quantity}</td>
           <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(it.price * it.quantity, order.currency)}</td>
         </tr>`,
    )
    .join("");
  const discountRow =
    order.discount > 0
      ? `<tr><td style="padding:6px 0;color:#16a34a;">Descuento (${order.couponCode || ""})</td>
             <td style="padding:6px 0;color:#16a34a;text-align:right;">-${money(order.discount, order.currency)}</td></tr>`
      : "";
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows}
      ${discountRow}
      <tr>
        <td style="padding:10px 0;font-weight:bold;">Total</td>
        <td style="padding:10px 0;font-weight:bold;text-align:right;">${money(order.total, order.currency)}</td>
      </tr>
    </table>`;
}

const shortId = (id) => String(id).slice(-6).toUpperCase();

/** Confirmation email to the customer. */
async function sendOrderConfirmationToCustomer(order, storeName = "la tienda") {
  const to = order.contact?.email;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">¡Gracias por tu compra!</h1>
      <p>Tu pedido <strong>#${shortId(order._id)}</strong> en ${storeName} fue confirmado.</p>
      ${itemsTable(order)}
      <p style="margin-top:24px;color:#666;font-size:13px;">Te avisaremos cuando tu pedido sea enviado.</p>
    </div>`;
  await sendEmail({
    to,
    subject: `Pedido confirmado #${shortId(order._id)}`,
    html,
  });
}

/** Sale notification to the store owner. */
async function sendNewSaleToOwner(order, ownerEmail, storeName = "tu tienda") {
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">¡Nueva venta! 🎉</h1>
      <p>Recibiste un nuevo pedido <strong>#${shortId(order._id)}</strong> en ${storeName}.</p>
      ${itemsTable(order)}
      <p style="margin-top:16px;font-size:14px;">
        <strong>Cliente:</strong> ${order.shippingAddress?.fullName || "—"}<br/>
        <strong>Email:</strong> ${order.contact?.email || "—"}<br/>
        <strong>Dirección:</strong> ${order.shippingAddress?.line1 || "—"}, ${order.shippingAddress?.city || ""}
      </p>
    </div>`;
  await sendEmail({
    to: ownerEmail,
    subject: `Nueva venta #${shortId(order._id)}`,
    html,
  });
}
/** Abandoned-cart reminder to the shopper. */
async function sendAbandonedCartEmail(
  cart,
  storeName = "la tienda",
  storeUrl = "",
) {
  const to = cart.email;
  const itemsHtml = cart.items
    .map(
      (it) =>
        `<tr>
           <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.name} × ${it.quantity}</td>
           <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(it.price * it.quantity, cart.currency)}</td>
         </tr>`,
    )
    .join("");

  const ctaUrl = storeUrl || "#";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">¿Te olvidaste algo? 🛒</h1>
      <p>Dejaste estos productos en tu carrito en ${storeName}. ¡Todavía estás a tiempo de completar tu compra!</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        ${itemsHtml}
      </table>
      <a href="${ctaUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
        Volver a mi carrito
      </a>
      <p style="margin-top:24px;color:#666;font-size:13px;">Si ya completaste tu compra, ignorá este mensaje.</p>
    </div>`;

  await sendEmail({
    to,
    subject: `Te quedaron productos en el carrito 🛒`,
    html,
  });
}
module.exports = {
  sendOrderConfirmationToCustomer,
  sendNewSaleToOwner,
  sendAbandonedCartEmail,
};
