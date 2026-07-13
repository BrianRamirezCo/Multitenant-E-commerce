const { MercadoPagoConfig } = require("mercadopago");
const logger = require("../../../config/logger");

/**
 * Resolves which MercadoPago access token to use for a tenant's ORDER payments.
 *
 * Strategy (supports dev sandbox + production with zero code changes):
 *   1. If the tenant has its OWN token configured -> use it (production case:
 *      each store collects payments in its own MercadoPago account).
 *   2. Otherwise fall back to the platform-wide TEST token (MP_TEST_ACCESS_TOKEN)
 *      -> convenient while developing/testing in sandbox.
 *
 * IMPORTANT: we intentionally do NOT fall back to MP_PLATFORM_TOKEN here. That
 * token belongs to the platform's own MercadoPago account (used for the SaaS
 * subscriptions in onboarding). Using it to charge a store's order would route
 * the buyer's money to the platform instead of the store. In production a store
 * MUST have its own token; if it doesn't, we return null and the caller errors
 * cleanly ("this store has no payment method configured").
 *
 * Returns null if neither is available.
 */
function resolveAccessToken(tenant) {
  const tenantToken = tenant?.mercadoPago?.accessToken;
  if (tenantToken) return tenantToken;

  const testToken = process.env.MP_TEST_ACCESS_TOKEN;
  if (testToken) {
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        { tenantSlug: tenant?.slug },
        "MP: tenant has no own token in PRODUCTION — falling back to MP_TEST_ACCESS_TOKEN. This store cannot collect real payments until it configures its own token.",
      );
    }
    return testToken;
  }

  return null;
}

/** True if this is a MercadoPago TEST/sandbox token (they are prefixed "TEST-"). */
function isTestToken(token) {
  return typeof token === "string" && token.startsWith("TEST-");
}

/** "test" | "prod" | "none" — human-readable mode for logging. */
function tokenMode(token) {
  if (!token) return "none";
  return isTestToken(token) ? "test" : "prod";
}

/**
 * Builds a MercadoPago SDK client for the given tenant.
 * Returns null when no token is available (logged), so the caller can error
 * cleanly instead of throwing.
 */
function getClient(tenant) {
  const accessToken = resolveAccessToken(tenant);
  if (!accessToken) {
    logger.warn(
      { tenantSlug: tenant?.slug },
      "MP: no access token available (no store token and no MP_TEST_ACCESS_TOKEN)",
    );
    return null;
  }
  return new MercadoPagoConfig({ accessToken });
}

module.exports = { resolveAccessToken, getClient, isTestToken, tokenMode };
