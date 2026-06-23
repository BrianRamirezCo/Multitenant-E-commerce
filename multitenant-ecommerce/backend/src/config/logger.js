const pino = require('pino');

/**
 * Base Pino logger.
 *
 * - In development: pretty-printed, colorized, human-readable output.
 * - In production: raw JSON (one log per line), ready to be shipped to a log
 *   aggregator (Logtail, Datadog, Sentry, etc.) without any transformation.
 *
 * Use child loggers (see requestLogger middleware) to automatically attach
 * per-request context such as tenantId and requestId to every log line.
 */
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  // Pretty transport only outside production for readable local logs.
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
  // Redact sensitive fields so tokens/passwords never end up in logs.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
