const rateLimit = require("express-rate-limit");

/**
 * Rate limiters to protect against brute force and API abuse.
 *
 * - apiLimiter: a generous global limit for the whole API.
 * - authLimiter: a strict limit for sensitive auth endpoints (login, signup)
 *   to slow down credential-stuffing / brute-force attempts.
 *
 * In development the limits are effectively disabled (very high) so they don't
 * get in the way while testing.
 */

const isProd = process.env.NODE_ENV === "production";

// Global API limiter: generous, just to stop abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 300 : 100000, // requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

// Strict limiter for auth endpoints (login / signup / refresh).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 100000, // attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful requests against the limit (only failed attempts).
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Too many attempts. Please try again later.",
  },
});

module.exports = { apiLimiter, authLimiter };
