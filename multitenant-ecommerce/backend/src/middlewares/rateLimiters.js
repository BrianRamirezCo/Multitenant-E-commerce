const rateLimit = require("express-rate-limit");

/**
 * Rate limiters to protect against brute force and API abuse.
 *
 * - apiLimiter: global limit for the whole API. Deliberately high because a
 *   single storefront page fires several GETs (tenant, products, categories,
 *   banner, reviews...) and Argentine ISPs heavily use CGNAT — many users share
 *   one public IP, so a low cap would 429 legitimate shoppers. Read requests
 *   (GET/HEAD) are not counted; the cap targets writes (POST/PATCH/DELETE).
 * - authLimiter: strict limit for sensitive auth endpoints (login, signup)
 *   to slow down credential-stuffing / brute-force attempts.
 *
 * In development the limits are effectively disabled (very high).
 */

const isProd = process.env.NODE_ENV === "production";

// Global API limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 3000 : 100000, // per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Don't rate-limit reads: storefront browsing is mostly GETs and, under
  // CGNAT, many legitimate users share one IP. The cap should bite on writes.
  skip: (req) => req.method === "GET" || req.method === "HEAD",
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

// Strict limiter for auth endpoints (login / signup / refresh).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 20 : 100000, // attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Only failed attempts count (successful logins don't burn the budget).
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Too many attempts. Please try again later.",
  },
});

module.exports = { apiLimiter, authLimiter };
