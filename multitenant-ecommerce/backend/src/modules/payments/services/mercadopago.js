const { MercadoPagoConfig } = require('mercadopago');

/**
 * Resolves which MercadoPago access token to use for a tenant's payments.
 *
 * Strategy (supports dev sandbox + production with zero code changes):
 *   1. If the tenant has its OWN token configured -> use it (production case:
 *      each store collects payments in its own MercadoPago account).
 *   2. Otherwise fall back to the platform-wide test token from the env
 *      (MP_TEST_ACCESS_TOKEN) -> convenient while developing/testing in sandbox.
 *
 * Returns null if neither is available (so the caller can error cleanly).
 */
function resolveAccessToken(tenant) {
  const tenantToken = tenant?.mercadoPago?.accessToken;
  if (tenantToken) return tenantToken;

  const globalTest = process.env.MP_TEST_ACCESS_TOKEN;
  if (globalTest) return globalTest;

  return null;
}

/**
 * Builds a MercadoPago SDK client for the given tenant.
 * Throws nothing; returns null when no token is available.
 */
function getClient(tenant) {
  const accessToken = resolveAccessToken(tenant);
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

module.exports = { resolveAccessToken, getClient };
