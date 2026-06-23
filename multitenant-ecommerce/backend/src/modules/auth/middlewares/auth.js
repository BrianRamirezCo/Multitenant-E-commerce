const User = require("../../../models/User");
const { verifyAccessToken } = require("../services/tokens");
const AppError = require("../../../utils/AppError");

/**
 * ============================================================================
 *  AUTH MIDDLEWARE
 * ============================================================================
 *
 * `protect`: requires a valid access token. It also enforces the multitenant
 * invariant — the token's tenantId MUST match the tenant resolved from the
 * subdomain (req.tenant). This blocks using a token issued for one store
 * against another store, even if the token itself is valid.
 *
 * Must run AFTER the tenantResolver (so req.tenant exists). On success it
 * attaches req.user.
 *
 * `restrictTo(...roles)`: gate a route to specific roles (e.g. 'admin').
 */

async function protect(req, res, next) {
  try {
    // Extract the Bearer token.
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return next(new AppError("Authentication required.", 401));
    }

    // Verify signature + expiry.
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new AppError("Invalid or expired token.", 401));
    }

    // Enforce tenant match: the token must belong to THIS tenant.
    if (req.tenant && payload.tenantId !== req.tenant._id.toString()) {
      return next(new AppError("Token does not belong to this store.", 403));
    }

    // Load the user (scoped to the tenant by the isolation plugin).
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };
}
/**
 * optionalAuth: like `protect`, but does NOT fail if there's no token.
 * If a valid token is present, sets req.user. If not (guest), continues anyway.
 * Used on public endpoints that behave differently when a user is logged in
 * (e.g. checkout: associate the order to the customer when authenticated).
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next(); // guest, continue

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(); // invalid token -> treat as guest, don't block
    }

    // Token must belong to this tenant; otherwise ignore it (guest).
    if (req.tenant && payload.tenantId !== req.tenant._id.toString()) {
      return next();
    }

    const user = await User.findById(payload.sub);
    if (user) req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect, restrictTo, optionalAuth };
