const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Global error handler. Catches everything forwarded via next(err).
 * Sends clean JSON to the client and avoids leaking internals in production.
 * Logs every error with full context (using the per-request child logger when
 * available, so tenantId and requestId are included automatically).
 */
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize common Mongoose errors into AppError instances.
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new AppError(`Duplicate value for field: ${field}`, 409);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(`Invalid input: ${messages.join('. ')}`, 400);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  // Log with the request-scoped logger if present, otherwise the base logger.
  const log = req.log || logger;
  const logPayload = {
    statusCode,
    message: err.message,
    stack: err.stack,
    isOperational: error.isOperational === true,
  };

  // Programming/unexpected errors (5xx, non-operational) are logged as errors;
  // expected operational client errors as warnings to keep noise down.
  if (statusCode >= 500 || !error.isOperational) {
    log.error(logPayload, 'unhandled error');
  } else {
    log.warn(logPayload, 'operational error');
  }

  const payload = {
    status,
    message: error.isOperational ? error.message : 'Something went wrong',
    requestId: req.id, // handy for support: user can quote it
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
