const { randomUUID } = require('crypto');
const logger = require('../config/logger');

/**
 * Request logging middleware.
 *
 * For every request it:
 *  1. Assigns a unique requestId (traces a single request across all log lines).
 *  2. Creates a CHILD logger that automatically carries requestId (and tenantId
 *     once the tenant is resolved) on every log call made during this request.
 *  3. Logs the completed request with method, url, status code and duration.
 *
 * The child logger is attached to req.log so controllers/services can do
 * `req.log.info('...')` and the tenant/request context is included for free.
 *
 * NOTE on ordering: mount this BEFORE the tenant resolver to capture every
 * request, then enrich with tenantId after the resolver runs (handled below).
 */
function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.id = requestId;

  // Child logger with request-scoped bindings.
  req.log = logger.child({ requestId });

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    // tenantId is set by the tenant resolver (if it ran for this route).
    const tenantId = req.tenant ? req.tenant._id.toString() : undefined;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      tenantId,
    };

    // Choose log level based on status code.
    if (res.statusCode >= 500) {
      req.log.error(logData, 'request failed');
    } else if (res.statusCode >= 400) {
      req.log.warn(logData, 'request client error');
    } else {
      req.log.info(logData, 'request completed');
    }
  });

  next();
}

module.exports = requestLogger;
