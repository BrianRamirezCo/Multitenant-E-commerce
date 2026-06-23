const crypto = require("crypto");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");
const Tenant = require("../../../models/Tenant");
const PendingSignup = require("../../../models/PendingSignup");
const { provisionTenant } = require("../services/provisioning.service");
const { hashPassword } = require("../../auth/services/password");
const { getPlan, PLAN_ORDER, PLANS } = require("../../../config/plans");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const logger = require("../../../config/logger");

/**
 * ============================================================================
 *  ONBOARDING CONTROLLERS  --  PLATFORM LEVEL (no tenant context)
 * ============================================================================
 *
 * These run OUTSIDE the tenant resolver: they create tenants, so there is no
 * "current tenant" yet. Mount them on the platform router.
 *
 * Flow:
 *   1. GET  /onboarding/plans              -> public pricing data for the landing
 *   2. GET  /onboarding/check-slug?slug=   -> is this store address available?
 *   3. POST /onboarding/signup             -> create subscription
 *   4. GET  /onboarding/status?ref=        -> post-payment provisioning status
 *   5. POST /onboarding/webhook            -> MercadoPago confirms payment
 *
 * SUBSCRIPTIONS: every plan bills monthly, so this uses MercadoPago "preapproval"
 * (recurring), NOT the one-time checkout used for product orders. The tenant is
 * provisioned only after the subscription is authorized (in the webhook).
 */

// GET /onboarding/plans  -> the pricing table the landing renders.
exports.getPlans = catchAsync(async (req, res) => {
  // Expose only what the landing needs (no internal flags).
  const plans = PLAN_ORDER.map((id) => {
    const p = PLANS[id];
    return {
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      price: p.price,
      popular: p.popular || false,
      limits: p.limits,
      features: p.features,
    };
  });
  res.json({ status: "success", plans });
});

// GET /onboarding/check-slug?slug=mystore
exports.checkSlug = catchAsync(async (req, res, next) => {
  const slug = String(req.query.slug || "")
    .toLowerCase()
    .trim();
  if (!/^[a-z0-9-]{3,}$/.test(slug)) {
    return next(
      new AppError(
        "Slug must be at least 3 chars: letters, numbers, hyphens.",
        400,
      ),
    );
  }
  const taken = await Tenant.exists({ slug });
  res.json({ status: "success", slug, available: !taken });
});

/**
 * POST /onboarding/signup
 * Body: { storeName, slug, plan, ownerName, ownerEmail, password }
 *
 * Every plan is paid, so the sequence is always:
 *   a) create a MercadoPago preapproval (subscription) -> returns an init_point URL
 *   b) respond with that URL so the frontend redirects the user to pay
 *   c) provisioning happens in the webhook once payment is authorized
 */
exports.signup = catchAsync(async (req, res, next) => {
  const {
    storeName,
    slug,
    plan = "starter",
    ownerName,
    ownerEmail,
    password,
    acceptedTerms,
  } = req.body;

  if (!storeName || !slug || !ownerName || !ownerEmail || !password) {
    return next(new AppError("Missing required fields.", 400));
  }

  // Legal: the terms must be explicitly accepted to create an account.
  if (acceptedTerms !== true) {
    return next(new AppError("You must accept the terms to continue.", 400));
  }

  const planConfig = getPlan(plan);

  // Hash the password with bcrypt (same util the auth login uses).
  const ownerPasswordHash = await hashPassword(password);

  // ---- ALL PLANS ARE PAID: create a subscription, defer provisioning to the
  //      webhook (the tenant is created only once payment is authorized). ----
  // Reserve the slug check up-front so the user doesn't pay for a taken slug.
  const normalizedSlug = String(slug).toLowerCase().trim();
  if (await Tenant.exists({ slug: normalizedSlug })) {
    return next(new AppError("That store address is already taken.", 409));
  }

  const externalReference = crypto.randomUUID();

  // Persist the signup intent so the webhook can finish provisioning after pay.
  // Persist the signup intent so the webhook can finish provisioning after pay.
  await PendingSignup.create({
    externalReference,
    slug: normalizedSlug,
    storeName,
    plan: planConfig.id,
    ownerName,
    ownerEmail: String(ownerEmail).toLowerCase().trim(),
    ownerPasswordHash,
    status: "pending",
    // Legal record captured at signup time.
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    termsVersion: "1.0",
    ipAddress: req.ip,
  });

  // Create the MercadoPago subscription (preapproval) with the PLATFORM token.
  const platformToken =
    process.env.MP_PLATFORM_TOKEN || process.env.MP_TEST_ACCESS_TOKEN;
  if (!platformToken) {
    return next(
      new AppError("Subscriptions are not configured on the platform.", 500),
    );
  }

  const client = new MercadoPagoConfig({ accessToken: platformToken });
  // back_url must be a PUBLIC https URL (MercadoPago rejects localhost for
  // subscriptions). In dev, set PLATFORM_PUBLIC_URL to an ngrok/public URL.
  const platformUrl =
    process.env.PLATFORM_PUBLIC_URL ||
    process.env.PLATFORM_URL ||
    "http://localhost:5173";

  // Subscription start ~5 min from now and end in 1 year. MercadoPago's
  // preapproval sometimes returns a 500 in sandbox without explicit dates.
  const startDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const endDate = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Build the preapproval body. NOTE: we omit `status` (sending "pending" with
  // no card token can trigger an internal error) and omit notification_url here
  // (it's configured on the app's webhook settings). MercadoPago returns an
  // init_point where the user enters their card and authorizes the subscription.
  const preapprovalBody = {
    reason: `Suscripción ${planConfig.name}`,
    external_reference: externalReference,
    payer_email: String(ownerEmail).toLowerCase().trim(),
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(planConfig.price.monthly),
      currency_id: "ARS",
      start_date: startDate,
      end_date: endDate,
    },
    back_url: `${platformUrl}/signup/success`,
  };

  let preapproval;
  try {
    preapproval = await new PreApproval(client).create({
      body: preapprovalBody,
    });
  } catch (err) {
    // Verbose logging: MercadoPago puts the real reason in cause/apiResponse.
    logger.error(
      {
        externalReference,
        message: err?.message,
        cause: err?.cause,
        apiResponse: err?.response?.data || err?.apiResponse,
        status: err?.status || err?.statusCode,
      },
      "MP preapproval creation failed",
    );
    await PendingSignup.deleteOne({ externalReference }).catch(() => {});
    return next(
      new AppError("Could not start the subscription. Try again.", 502),
    );
  }

  // Save the preapproval id for reconciliation.
  await PendingSignup.updateOne(
    { externalReference },
    { preapprovalId: preapproval.id },
  );

  logger.info(
    { externalReference, plan: planConfig.id },
    "paid signup initiated",
  );

  return res.status(202).json({
    status: "pending_payment",
    message: "Redirect the user to MercadoPago to complete the subscription.",
    externalReference,
    initPoint: preapproval.init_point, // MercadoPago subscription checkout URL
  });
});

/**
 * GET /onboarding/status?ref=<externalReference>
 * Lets the post-payment page poll whether the tenant was provisioned yet
 * (the webhook completes provisioning asynchronously).
 */
exports.signupStatus = catchAsync(async (req, res, next) => {
  const ref = String(req.query.ref || "").trim();
  if (!ref) return next(new AppError("Missing reference.", 400));

  const pending = await PendingSignup.findOne({ externalReference: ref });
  if (!pending) {
    // No pending doc: either already completed+cleaned, or invalid ref.
    return res.json({ status: "unknown" });
  }

  // If completed, return the store slug so the front can link to login.
  if (pending.status === "completed") {
    const tenant = await Tenant.findOne({ slug: pending.slug });
    return res.json({
      status: "completed",
      store: tenant
        ? { slug: tenant.slug, name: tenant.name, url: storeUrl(tenant.slug) }
        : null,
    });
  }

  // pending or failed
  res.json({ status: pending.status });
});

/**
 * POST /onboarding/webhook  -> MercadoPago notifies subscription events.
 * On an authorized subscription, provision the tenant for the stored intent.
 */
exports.webhook = catchAsync(async (req, res) => {
  // MP sends different shapes; we look for a preapproval notification.
  const type = req.query.type || req.body?.type;
  const preapprovalId = req.body?.data?.id || req.query["data.id"];

  if (
    (type !== "subscription_preapproval" && type !== "preapproval") ||
    !preapprovalId
  ) {
    return res.sendStatus(200);
  }

  const platformToken =
    process.env.MP_PLATFORM_TOKEN || process.env.MP_TEST_ACCESS_TOKEN;
  if (!platformToken) return res.sendStatus(200);

  // Fetch the subscription to read its status + external_reference.
  let sub;
  try {
    const client = new MercadoPagoConfig({ accessToken: platformToken });
    sub = await new PreApproval(client).get({ id: preapprovalId });
  } catch (err) {
    logger.error(
      { err: err?.message, preapprovalId },
      "webhook: failed to fetch preapproval",
    );
    return res.sendStatus(200);
  }

  // Only provision when the subscription is authorized/active.
  if (sub.status !== "authorized") {
    return res.sendStatus(200);
  }

  const pending = await PendingSignup.findOne({
    externalReference: sub.external_reference,
  });
  if (!pending || pending.status === "completed") {
    return res.sendStatus(200); // nothing to do or already provisioned
  }

  // Provision the tenant + owner now that payment is confirmed.
  // Provision the tenant + owner now that payment is confirmed.
  try {
    await provisionTenant({
      slug: pending.slug,
      storeName: pending.storeName,
      plan: pending.plan,
      ownerName: pending.ownerName,
      ownerEmail: pending.ownerEmail,
      ownerPasswordHash: pending.ownerPasswordHash, // already bcrypt-hashed
      // Carry the legal acceptance from the pending signup into the tenant.
      legal: {
        termsAccepted: pending.termsAccepted,
        termsAcceptedAt: pending.termsAcceptedAt,
        termsVersion: pending.termsVersion,
        ipAddress: pending.ipAddress,
      },
    });
    pending.status = "completed";
    await pending.save();
    logger.info({ slug: pending.slug }, "paid tenant provisioned from webhook");
  } catch (err) {
    pending.status = "failed";
    await pending.save().catch(() => {});
    logger.error(
      { err: err?.message, slug: pending.slug },
      "provisioning from webhook failed",
    );
  }

  res.sendStatus(200);
});

// ---- helpers ----

function storeUrl(slug) {
  const root = process.env.ROOT_DOMAIN || "yourapp.com";
  return `https://${slug}.${root}`;
}
