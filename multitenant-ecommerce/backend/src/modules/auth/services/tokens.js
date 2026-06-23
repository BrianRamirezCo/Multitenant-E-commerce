const jwt = require("jsonwebtoken");

/**
 * JWT token utilities for the auth system.
 *
 * Two token types:
 *  - ACCESS token: short-lived (~15m), sent in the Authorization header,
 *    held in memory on the frontend (Redux). Carries userId, tenantId, role.
 *  - REFRESH token: long-lived (~7d), stored in an httpOnly cookie. Used to
 *    mint new access tokens without re-login.
 *
 * MULTITENANT SECURITY: both tokens embed tenantId. The `protect` middleware
 * verifies that the token's tenantId matches the tenant resolved from the
 * subdomain — so a valid token for store A cannot be used against store B.
 */

// Secrets MUST be set via env vars in production. In development we allow a
// fallback so the app runs out of the box, but in production a missing secret
// is a fatal misconfiguration (using a known fallback would let anyone forge
// tokens), so we throw instead.
function requireSecret(envValue, name, devFallback) {
  if (envValue) return envValue;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `FATAL: ${name} is not set. Refusing to start in production with an insecure fallback.`,
    );
  }
  return devFallback;
}

const ACCESS_SECRET = () =>
  requireSecret(
    process.env.ACCESS_TOKEN_SECRET,
    "ACCESS_TOKEN_SECRET",
    "dev-access-secret",
  );
const REFRESH_SECRET = () =>
  requireSecret(
    process.env.REFRESH_TOKEN_SECRET,
    "REFRESH_TOKEN_SECRET",
    "dev-refresh-secret",
  );
const ACCESS_EXPIRES = () => process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_EXPIRES = () => process.env.REFRESH_TOKEN_EXPIRES || "7d";

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      type: "access",
    },
    ACCESS_SECRET(),
    { expiresIn: ACCESS_EXPIRES() },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      type: "refresh",
    },
    REFRESH_SECRET(),
    { expiresIn: REFRESH_EXPIRES() },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET());
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
