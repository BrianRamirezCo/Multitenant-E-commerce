const Tenant = require("../models/Tenant");
const { runWithTenant } = require("../plugins/tenantPlugin");
const AppError = require("../utils/AppError");

/**
 * ============================================================================
 *  TENANT RESOLVER MIDDLEWARE
 * ============================================================================
 *
 * Runs BEFORE every tenant-scoped route. Its job:
 *  1. Figure out which tenant this request belongs to (from the subdomain
 *     or, optionally, a custom domain).
 *  2. Load that tenant from the database.
 *  3. Attach it to req.tenant.
 *  4. Open the tenant async-context so the isolation plugin auto-filters
 *     every query for the rest of this request.
 *
 * Resolution strategy used here: SUBDOMAIN.
 *   store-a.yourapp.com  -> slug "store-a"
 *   store-b.yourapp.com  -> slug "store-b"
 *
 * It also supports a custom domain lookup (www.thestore.com -> tenant).
 *
 * In local development there are no subdomains, so we allow an override via
 * the `x-tenant-slug` header (configurable). Never trust that header in prod.
 */

/**
 * Extract the tenant slug from the request host.
 * Returns null if no tenant subdomain is present (e.g. the bare apex domain).
 */
function extractSlugFromHost(host, rootDomain) {
  if (!host) return null;

  // Strip the port if present (localhost:5000 -> localhost).
  const hostname = host.split(":")[0];

  // If it does not end with the configured root domain, it might be a custom domain.
  if (!hostname.endsWith(rootDomain)) {
    return null;
  }

  // Remove the root domain to get the subdomain part.
  // store-a.yourapp.com - yourapp.com -> "store-a."
  const subPart = hostname
    .slice(0, hostname.length - rootDomain.length)
    .replace(/\.$/, "");

  if (!subPart) return null; // bare apex domain (yourapp.com), no tenant
  if (subPart === "www") return null; // marketing site, not a tenant

  // Only take the left-most label (ignore nested subdomains).
  return subPart.split(".")[0];
}

function tenantResolver(options = {}) {
  const rootDomain =
    options.rootDomain || process.env.ROOT_DOMAIN || "yourapp.com";
  // El header x-tenant-slug se acepta siempre en dev. En producción SOLO si se
  // habilita explícitamente con ALLOW_TENANT_HEADER=true.
  //
  // ⚠️ ESTO ES UN ESCAPE HATCH TEMPORAL: mientras esté prendido, cualquiera que
  // mande ese header puede pedirle datos a cualquier tienda (no hay aislamiento
  // real entre tenants). Sirve para probar el deploy sin dominio propio.
  // APAGARLO (borrar la env) apenas tengas el wildcard DNS andando y ANTES de
  // que haya un cliente real con datos en la plataforma.
  const allowHeaderOverride =
    options.allowHeaderOverride ??
    (process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_TENANT_HEADER === "true");

  return async function (req, res, next) {
    try {
      let tenant = null;
      const host = req.headers.host;

      // --- Development convenience: resolve by header ---
      if (allowHeaderOverride && req.headers["x-tenant-slug"]) {
        tenant = await Tenant.findOne({ slug: req.headers["x-tenant-slug"] });
      }

      // --- Resolve by subdomain ---
      if (!tenant) {
        const slug = extractSlugFromHost(host, rootDomain);
        if (slug) {
          tenant = await Tenant.findOne({ slug });
        }
      }

      // --- Fallback: resolve by custom domain ---
      if (!tenant && host) {
        const hostname = host.split(":")[0];
        tenant = await Tenant.findOne({ customDomain: hostname });
      }

      if (!tenant) {
        return next(new AppError("Tenant not found for this domain", 404));
      }

      if (tenant.status === "suspended") {
        return next(new AppError("This store is currently suspended", 403));
      }

      // Attach to the request for controllers/services to use.
      req.tenant = tenant;

      // Enrich the request-scoped logger so every subsequent log line for this
      // request automatically carries the tenantId (great for support/debugging).
      if (req.log) {
        req.log = req.log.child({
          tenantId: tenant._id.toString(),
          tenantSlug: tenant.slug,
        });
      }

      // Open the async-context: from here on, every DB query in this request
      // is automatically scoped to this tenant by the isolation plugin.
      runWithTenant(tenant._id, () => next());
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { tenantResolver, extractSlugFromHost };
