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

/** Escape user-controlled text before injecting it into email HTML. */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Platform brand (the SaaS itself). Used for platform emails (owner welcome,
// admin password reset). Set PLATFORM_LOGO_URL in .env when you have a hosted
// logo; otherwise the name renders as styled text.
const PLATFORM_BRAND = {
  name: "CONST",
  logoUrl: process.env.PLATFORM_LOGO_URL || null,
};

/**
 * Shared email shell. Wraps any inner HTML with a branded header + footer so
 * every email looks consistent.
 *
 * @param {object} opts
 * @param {string} opts.brandName  - name shown in the header (CONST or a store)
 * @param {string} [opts.brandLogo]- logo URL; falls back to styled text name
 * @param {string} opts.body       - the inner HTML (the actual message)
 * @param {string} [opts.footerNote]- small print at the bottom
 */
function renderEmail({ brandName, brandLogo, body, footerNote }) {
  const header = brandLogo
    ? `<img src="${brandLogo}" alt="${esc(brandName)}" style="height:48px;width:auto;" />`
    : `<span style="font-family:'Inter',system-ui,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${esc(brandName)}</span>`;

  return `
  <div style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Inter',system-ui,-apple-system,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background-color:#0a0a0a;padding:28px 32px;text-align:center;">
                ${header}
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px;color:#171717;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#fafafa;border-top:1px solid #eeeeee;padding:24px 32px;text-align:center;">
                <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;">
                  ${footerNote || `Este correo fue enviado por ${esc(brandName)}.`}
                </p>
                <p style="margin:8px 0 0;color:#c4c4c8;font-size:11px;">
                  © ${new Date().getFullYear()} ${esc(brandName)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

/** Small helper: a styled CTA button for emails. */
function emailButton(url, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
      <tr>
        <td style="border-radius:999px;background-color:#0a0a0a;">
          <a href="${url}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
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
           <td style="padding:8px 0;border-bottom:1px solid #eee;">${esc(it.name)} × ${esc(it.quantity)}</td>
           <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(it.price * it.quantity, order.currency)}</td>
         </tr>`,
    )
    .join("");
  const discountRow =
    order.discount > 0
      ? `<tr><td style="padding:6px 0;color:#16a34a;">Descuento (${esc(order.couponCode || "")})</td>
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

/**
 * Generic welcome email. Used for the CUSTOMER who just registered in a store.
 * Brand = the store's brand; optional CTA + intro passed by the caller.
 */
async function sendWelcomeEmail({
  to,
  name,
  brand = PLATFORM_BRAND,
  cta,
  intro,
  subject,
}) {
  const brandName = brand?.name || PLATFORM_BRAND.name;
  const brandLogo = brand?.logoUrl || null;
  const greeting = name ? `¡Hola, ${esc(name)}!` : "¡Hola!";
  const introHtml =
    intro ||
    `Te damos la bienvenida a <strong>${esc(brandName)}</strong>. Tu cuenta ya está lista para usar.`;

  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#171717;">${greeting}</h1>
    <p style="margin:0 0 8px;color:#52525b;">${introHtml}</p>
    ${cta?.url ? emailButton(cta.url, cta.label || "Comenzar") : ""}
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;">Si no esperabas este correo, podés ignorarlo.</p>`;

  const html = renderEmail({
    brandName,
    brandLogo,
    body,
    footerNote: `Este correo fue enviado por ${brandName}.`,
  });

  await sendEmail({
    to,
    subject: subject || `Bienvenido a ${brandName}`,
    html,
  });
}

/**
 * Welcome email for a store OWNER right after their store is provisioned.
 * Platform-branded (CONST), with curated copy + a feature checklist and a CTA
 * to the admin panel.
 *
 * @param {string}  to        - owner email
 * @param {string} [name]     - owner's name (greeting)
 * @param {string}  panelUrl  - link to the admin panel (CTA button)
 */
async function sendOwnerWelcomeEmail(to, name, panelUrl) {
  const brandName = PLATFORM_BRAND.name;
  const brandLogo = PLATFORM_BRAND.logoUrl;

  const features = [
    "Administrar productos e inventario.",
    "Gestionar pedidos.",
    "Personalizar tu tienda.",
    "Aceptar pagos online.",
    "Hacer crecer tu negocio.",
  ];
  const featureList = features
    .map(
      (f) =>
        `<tr><td style="padding:5px 0;color:#3f3f46;font-size:15px;">
           <span style="color:#16a34a;font-weight:700;">&#10003;</span>&nbsp;&nbsp;${esc(f)}
         </td></tr>`,
    )
    .join("");

  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#171717;">
      ${name ? `¡Hola, ${esc(name)}!` : "¡Hola!"}
    </h1>
    <p style="margin:0 0 12px;color:#52525b;">
      ¡Bienvenido a <strong>${esc(brandName)}</strong>! Nos alegra que hayas decidido crear tu tienda con nosotros. A partir de este momento ya podés comenzar a configurar tu negocio online desde tu panel de administración.
    </p>
    <p style="margin:0 0 4px;color:#52525b;">Con <strong>${esc(brandName)}</strong> vas a poder:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 8px;">
      ${featureList}
    </table>
    ${emailButton(panelUrl, "Ir a mi panel")}
    <p style="margin:8px 0 12px;color:#52525b;">
      Nuestro objetivo es ofrecerte una plataforma rápida, moderna y fácil de usar para que puedas concentrarte en vender.
    </p>
    <p style="margin:0 0 12px;color:#71717a;font-size:14px;">
      Si necesitás ayuda o tenés alguna consulta, podés responder este correo y con gusto te ayudamos.
    </p>
    <p style="margin:0;color:#52525b;">
      ¡Gracias por confiar en ${esc(brandName)}!<br/>El equipo de ${esc(brandName)}.
    </p>`;

  const html = renderEmail({
    brandName,
    brandLogo,
    body,
    footerNote: `Recibiste este correo porque creaste una tienda en ${brandName}.`,
  });

  await sendEmail({ to, subject: `¡Bienvenido a ${brandName}! 🚀`, html });
}

/** Confirmation email to the customer. */
async function sendOrderConfirmationToCustomer(order, storeName = "la tienda") {
  const to = order.contact?.email;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">¡Gracias por tu compra!</h1>
      <p>Tu pedido <strong>#${shortId(order._id)}</strong> en ${esc(storeName)} fue confirmado.</p>
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
      <p>Recibiste un nuevo pedido <strong>#${shortId(order._id)}</strong> en ${esc(storeName)}.</p>
      ${itemsTable(order)}
      <p style="margin-top:16px;font-size:14px;">
        <strong>Cliente:</strong> ${esc(order.shippingAddress?.fullName || "—")}<br/>
        <strong>Email:</strong> ${esc(order.contact?.email || "—")}<br/>
        <strong>Dirección:</strong> ${esc(order.shippingAddress?.line1 || "—")}, ${esc(order.shippingAddress?.city || "")}
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
           <td style="padding:8px 0;border-bottom:1px solid #eee;">${esc(it.name)} × ${esc(it.quantity)}</td>
           <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(it.price * it.quantity, cart.currency)}</td>
         </tr>`,
    )
    .join("");

  const ctaUrl = storeUrl || "#";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">¿Te olvidaste algo? 🛒</h1>
      <p>Dejaste estos productos en tu carrito en ${esc(storeName)}. ¡Todavía estás a tiempo de completar tu compra!</p>
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

/**
 * Password reset email. The `brand` decides which identity shows in the email:
 *   - admin reset    -> the platform brand (CONST)
 *   - customer reset -> the store's brand (name + logo)
 * Falls back to the platform brand if none is provided.
 */
async function sendPasswordResetEmail(to, resetUrl, brand = PLATFORM_BRAND) {
  const brandName = brand?.name || PLATFORM_BRAND.name;
  const brandLogo = brand?.logoUrl || null;

  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#171717;">
      Restablecé tu contraseña
    </h1>
    <p style="margin:0 0 8px;color:#52525b;">
      Recibimos un pedido para restablecer la contraseña de tu cuenta en
      <strong>${esc(brandName)}</strong>. Hacé clic en el botón para crear una nueva.
      Este enlace vence en 1 hora.
    </p>
    ${emailButton(resetUrl, "Restablecer contraseña")}
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;">
      Si no pediste esto, ignorá este correo: tu contraseña no cambiará.
    </p>
    <p style="margin:12px 0 0;color:#c4c4c8;font-size:12px;word-break:break-all;">
      O copiá este enlace: ${esc(resetUrl)}
    </p>`;

  const html = renderEmail({
    brandName,
    brandLogo,
    body,
    footerNote: `Recibiste este correo porque se solicitó restablecer tu contraseña en ${brandName}.`,
  });

  await sendEmail({
    to,
    subject: `Restablecé tu contraseña — ${brandName}`,
    html,
  });
}

module.exports = {
  PLATFORM_BRAND,
  sendWelcomeEmail,
  sendOwnerWelcomeEmail,
  sendOrderConfirmationToCustomer,
  sendNewSaleToOwner,
  sendAbandonedCartEmail,
  sendPasswordResetEmail,
  esc,
};
