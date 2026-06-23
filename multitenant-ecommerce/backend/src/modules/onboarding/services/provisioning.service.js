const Tenant = require("../../../models/Tenant");
const User = require("../../../models/User");
const { runWithTenant } = require("../../../plugins/tenantPlugin");
const { getPlan } = require("../../../config/plans");
const AppError = require("../../../utils/AppError");
const logger = require("../../../config/logger");

/**
 * ============================================================================
 *  TENANT PROVISIONING SERVICE
 * ============================================================================
 *
 * Creates a brand-new store (tenant) plus its owner admin user. This is what
 * runs when a customer completes signup/payment.
 *
 * Steps:
 *   1. Validate the slug is available.
 *   2. Create the Tenant (with the chosen plan, default theme, legal record).
 *   3. Create the owner User (role 'admin', isOwner true) with an EXPLICIT
 *      tenantId — the AsyncLocalStorage context is unreliable across the await
 *      inside Model.create(), so we never rely on it for writes.
 *
 * Returns { tenant, owner }.
 */
async function provisionTenant({
  slug,
  storeName,
  plan,
  ownerName,
  ownerEmail,
  ownerPasswordHash,
  legal, // optional: { termsAccepted, termsAcceptedAt, termsVersion, ipAddress }
}) {
  const normalizedSlug = String(slug).toLowerCase().trim();

  // 1. Slug availability.
  const existing = await Tenant.findOne({ slug: normalizedSlug });
  if (existing) {
    throw new AppError(
      "That store address is already taken. Choose another.",
      409,
    );
  }

  // Validate the plan exists (defaults to starter if unknown).
  const planConfig = getPlan(plan);

  // 2. Create the tenant.
  const tenant = await Tenant.create({
    slug: normalizedSlug,
    name: storeName,
    plan: planConfig.id,
    status: "active",
    theme: { name: "minimal", primaryColor: null, logoUrl: null },
    // Persist the legal acceptance record captured at signup (if provided).
    legal: {
      termsAccepted: legal?.termsAccepted ?? false,
      termsAcceptedAt: legal?.termsAcceptedAt ?? null,
      termsVersion: legal?.termsVersion ?? null,
      ipAddress: legal?.ipAddress ?? null,
    },
  });

  // 3. Create the owner admin. Pass tenantId EXPLICITLY (don't rely on the
  //    async context, which is lost across awaits in create()). Mark as owner:
  //    the first admin of a store is its owner — protected and the only one who
  //    can manage users.
  try {
    const owner = await User.create({
      name: ownerName,
      email: String(ownerEmail).toLowerCase().trim(),
      password: ownerPasswordHash, // already hashed by the caller (auth service)
      role: "admin",
      isOwner: true,
      tenantId: tenant._id,
    });

    logger.info(
      { tenantId: tenant._id.toString(), slug: normalizedSlug },
      "tenant provisioned",
    );
    return { tenant, owner };
  } catch (err) {
    // Best-effort cleanup: remove the orphan tenant so the slug is freed.
    await Tenant.deleteOne({ _id: tenant._id }).catch(() => {});
    if (err.code === 11000) {
      throw new AppError(
        "An account with that email already exists for this store.",
        409,
      );
    }
    throw err;
  }
}

module.exports = { provisionTenant };
