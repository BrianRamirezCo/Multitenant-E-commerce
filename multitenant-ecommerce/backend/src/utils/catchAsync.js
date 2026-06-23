/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * global error handler instead of crashing or hanging the request.
 * Avoids repetitive try/catch blocks in every controller.
 *
 * Usage:
 *   router.get('/', catchAsync(async (req, res) => { ... }));
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
