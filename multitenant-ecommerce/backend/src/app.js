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

function isAllowedOrigin(origin) {
  // Non-browser requests (curl, server-to-server) have no origin -> allow.
  if (!origin) return true;
  if (process.env.NODE_ENV !== "production") return true;

  try {
    const { hostname } = new URL(origin);
    // Allow the apex domain and any subdomain of it (tenant stores).
    if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      return true;
    }
    // Allow extra origins listed in CORS_EXTRA_ORIGINS (comma-separated), e.g.
    // the Vercel frontend domain or specific tenant custom domains.
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
