/**
 * Custom application error. Carries an HTTP status code and a flag that marks
 * the error as "operational" (expected / handled), as opposed to a programming bug.
 * This mirrors the pattern already used in Lumina.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
