const Subscriber = require("../../../models/Subscriber");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Newsletter subscribers.
 *  - subscribe   : public (storefront). Adds an email, ignores duplicates.
 *  - list        : admin only. Returns all subscribers for the store.
 */

// Basic email shape check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /subscribers  -> public: a visitor subscribes from the storefront.
exports.subscribe = catchAsync(async (req, res, next) => {
  const email = (req.body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return next(new AppError("Invalid email address.", 400));
  }

  // Upsert-like: if it already exists, treat as success (don't error).
  try {
    await Subscriber.create({
      tenantId: req.tenant._id,
      email,
      source: "storefront",
    });
  } catch (err) {
    // Duplicate key (already subscribed) -> still a success for the user.
    if (err.code !== 11000) throw err;
  }

  res.status(201).json({ status: "success" });
});

// GET /subscribers  -> admin: list all subscribers for this store.
exports.listSubscribers = catchAsync(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  res.json({
    status: "success",
    total: subscribers.length,
    subscribers: subscribers.map((s) => ({
      id: s._id,
      email: s.email,
      createdAt: s.createdAt,
    })),
  });
});
