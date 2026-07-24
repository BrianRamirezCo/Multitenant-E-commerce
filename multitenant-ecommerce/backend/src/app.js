const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");
const { apiLimiter } = require("./middlewares/rateLimiters");
const AppError = require("./utils/AppError");

const app = express();

// Behind a proxy in production (Railway/Vercel), trust the first proxy hop so
// req.ip and secure cookies work correctly.
app.set("trust proxy", 1);

// --- Security headers ---
app.use(helmet());

// --- CORS ---
// In production, only allow our own apex + tenant subdomains + custom domains.
// In development, allow everything for convenience.
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "yourapp.com";

// Vercel generates a NEW hostname for every deployment
// (my-app-<hash>-<team>.vercel.app). Listing them one by one in
// CORS_EXTRA_ORIGINS is unmaintainable, so we allow the whole preview namespace
// of OUR project via VERCEL_PREVIEW_SUFFIX (e.g. "-brian-ramirez-s-projects.vercel.app").
//
// It is deliberately NOT a blanket "*.vercel.app": with credentials enabled,
// that would let any app deployed on Vercel talk to this API using a logged-in
// user's cookies.
const VERCEL_PREVIEW_SUFFIX = process.env.VERCEL_PREVIEW_SUFFIX || "";

function isAllowedOrigin(origin) {
  // Non-browser requests (curl, server-to-server, MercadoPago webhooks) have no
  // origin -> allow. They aren't subject to the same-origin policy anyway.
  if (!origin) return true;
  if (process.env.NODE_ENV !== "production") return true;

  try {
    const { protocol, hostname } = new URL(origin);
    // Only ever trust HTTPS origins in production.
    if (protocol !== "https:") return false;

    // Apex domain and any subdomain of it (tenant stores).
    if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      return true;
    }

    // Our own Vercel deployments (production alias + every preview build).
    if (VERCEL_PREVIEW_SUFFIX && hostname.endsWith(VERCEL_PREVIEW_SUFFIX)) {
      return true;
    }

    // Explicit extra origins (comma-separated): the stable Vercel alias, or a
    // tenant's custom domain.
    const extra = (process.env.CORS_EXTRA_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (extra.includes(origin) || extra.includes(hostname)) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // needed for httpOnly refresh cookies
  }),
);

// --- Body parsing (with a size limit to avoid huge-payload abuse) ---
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Request logging (assigns requestId + child logger). Mount early so every
// request is captured; tenantId is added later by the tenant resolver.
app.use(requestLogger);

// --- Health check ---
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- API (with global rate limiting) ---
app.use("/api", apiLimiter, apiRoutes);

// --- 404 ---
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
