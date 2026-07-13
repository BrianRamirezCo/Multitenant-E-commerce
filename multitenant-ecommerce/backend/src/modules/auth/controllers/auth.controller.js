const User = require("../../../models/User");
const { hashPassword, comparePassword } = require("../services/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../services/tokens");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const crypto = require("crypto");
const {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  esc,
} = require("../../../services/email");

/**
 * ============================================================================
 *  AUTH CONTROLLERS  (tenant-scoped)
 * ============================================================================
 *
 * All run inside the tenant context (after tenantResolver), so users are
 * created/looked up within the current store automatically. The same email can
 * exist in different stores (compound unique index { tenantId, email }).
 *
 * Token strategy:
 *   - access token  -> returned in the JSON body (frontend keeps it in memory)
 *   - refresh token -> set as an httpOnly cookie (frontend never reads it)
 */

const REFRESH_COOKIE = "refresh_token";

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? "none" : "lax", // 'none' needed for cross-subdomain in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth", // only sent to auth routes
  };
}

// Shapes the user object returned to the client (includes profile).
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isOwner: Boolean(user.isOwner),
    profile: user.profile || null,
    wishlist: (user.wishlist || []).map((id) => String(id)),
  };
}

function authResponse(res, user, statusCode = 200) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(statusCode).json({
    status: "success",
    accessToken,
    user: publicUser(user),
  });
}

// POST /auth/register  -> create a customer account in THIS store
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required.", 400));
  }
  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters.", 400));
  }

  const hashed = await hashPassword(password);

  let user;
  try {
    // Set tenantId explicitly from the resolved tenant (don't rely on async context).
    user = await User.create({
      name,
      email,
      password: hashed,
      role: "customer",
      tenantId: req.tenant._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(
        new AppError("An account with that email already exists.", 409),
      );
    }
    throw err;
  }

  // Bienvenida al cliente — marca de LA TIENDA (nombre + logo del tenant).
  // Fire-and-forget: si el mail falla NO rompe el registro; se loguea.
  const store = req.tenant;
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  sendWelcomeEmail({
    to: user.email,
    name: user.name,
    brand: { name: store.name, logoUrl: store.theme?.logoUrl || null },
    cta: { url: `${base}/store`, label: "Ir a la tienda" },
    intro: `¡Gracias por sumarte a <strong>${esc(
      store.name,
    )}</strong>! Ya podés explorar el catálogo y guardar tus favoritos.`,
  }).catch((err) =>
    console.error("welcome email to customer failed:", err?.message),
  );

  authResponse(res, user, 201);
});

// POST /auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Email and password are required.", 400));
  }

  // Need the password field explicitly (select: false on the model).
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password",
  );
  if (!user || !(await comparePassword(password, user.password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  authResponse(res, user);
});

// POST /auth/refresh  -> mint a new access token from the refresh cookie
exports.refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    return next(new AppError("No refresh token.", 401));
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return next(new AppError("Invalid or expired refresh token.", 401));
  }

  // Refresh token must belong to this tenant.
  if (req.tenant && payload.tenantId !== req.tenant._id.toString()) {
    return next(new AppError("Token does not belong to this store.", 403));
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return next(new AppError("User no longer exists.", 401));
  }

  authResponse(res, user);
});

// POST /auth/logout  -> clear the refresh cookie
exports.logout = catchAsync(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, {
    ...refreshCookieOptions(),
    maxAge: undefined,
  });
  res.json({ status: "success" });
});

// GET /auth/me  -> current user (requires protect)
exports.me = catchAsync(async (req, res) => {
  res.json({ status: "success", user: publicUser(req.user) });
});

// PATCH /auth/profile  -> update the current user's profile (name, phone, address)
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = req.user;

  if (name) user.name = name;
  user.profile = user.profile || {};
  if (phone !== undefined) user.profile.phone = phone;
  if (address) {
    user.profile.address = { ...(user.profile.address || {}), ...address };
  }

  await user.save();
  res.json({ status: "success", user: publicUser(user) });
});
// PATCH /auth/password -> change the logged-in user's password (needs current)
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError("Current and new password are required.", 400));
  }
  if (newPassword.length < 8) {
    return next(new AppError("Password must be at least 8 characters.", 400));
  }

  // Re-fetch with the password field (select:false on the model).
  const user = await User.findById(req.user._id).select("+password");
  if (!user) return next(new AppError("User no longer exists.", 401));

  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) {
    return next(new AppError("Your current password is incorrect.", 401));
  }

  // Don't allow reusing the exact same password.
  const same = await comparePassword(newPassword, user.password);
  if (same) {
    return next(
      new AppError(
        "The new password must be different from the current one.",
        400,
      ),
    );
  }

  user.password = await hashPassword(newPassword);
  // Invalidate any pending reset token, por las dudas.
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({ status: "success", message: "Password updated." });
});
// GET /auth/wishlist  -> the customer's saved products (full product docs).
exports.getWishlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.json({
    status: "success",
    products: user?.wishlist || [],
  });
});

// POST /auth/wishlist/:productId  -> add a product to the wishlist.
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));

  const already = (user.wishlist || []).some(
    (id) => String(id) === String(productId),
  );
  if (!already) {
    user.wishlist.push(productId);
    await user.save();
  }

  res.json({
    status: "success",
    wishlist: user.wishlist.map((id) => String(id)),
  });
});

// DELETE /auth/wishlist/:productId  -> remove a product from the wishlist.
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));

  user.wishlist = (user.wishlist || []).filter(
    (id) => String(id) !== String(productId),
  );
  await user.save();

  res.json({
    status: "success",
    wishlist: user.wishlist.map((id) => String(id)),
  });
});

// POST /auth/forgot-password  -> generate a reset token and email it.
// The tenant is resolved by the middleware, so we look up the user WITHIN this
// store's context (multitenant-safe). Always responds success, even if the
// email doesn't exist, to avoid leaking which emails are registered.
exports.forgotPassword = catchAsync(async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  // 'context' tells us which reset page the link should point to.
  const context = req.body.context === "admin" ? "admin" : "store";

  const user = await User.findOne({ email });

  // Always behave the same whether or not the user exists.
  if (user) {
    // Create a random token; store only its HASH (so a DB leak can't be used).
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Build the reset link. The frontend reset page reads ?token= and ?email=.
    const base = process.env.FRONTEND_URL || "http://localhost:5173";
    const path =
      context === "admin" ? "/admin/reset-password" : "/store/reset-password";
    const resetUrl = `${base}${path}?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Decide the brand shown in the email:
    //   admin reset    -> the platform brand (CONST)
    //   customer reset -> the store's own brand (name + logo)
    const brand =
      context === "admin"
        ? { name: "CONST", logoUrl: process.env.PLATFORM_LOGO_URL || null }
        : {
            name: req.tenant?.name || "la tienda",
            logoUrl: req.tenant?.theme?.logoUrl || null,
          };

    await sendPasswordResetEmail(email, resetUrl, brand);
  }

  res.json({
    status: "success",
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
});

// POST /auth/reset-password  -> validate the token and set a new password.
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return next(new AppError("Token and new password are required.", 400));
  }
  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters.", 400));
  }

  // Hash the incoming token the same way and find a matching, unexpired user.
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired reset link.", 400));
  }

  // Set the new password and clear the reset fields.
  user.password = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({
    status: "success",
    message: "Password updated. You can now log in.",
  });
});
