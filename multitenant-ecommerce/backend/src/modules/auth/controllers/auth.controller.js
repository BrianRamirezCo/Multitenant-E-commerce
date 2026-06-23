const User = require("../../../models/User");
const { hashPassword, comparePassword } = require("../services/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../services/tokens");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

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
