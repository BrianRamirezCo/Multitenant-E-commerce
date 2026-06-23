const { hasFeature, isUnderLimit, getLimit } = require('../config/plans');
const AppError = require('../utils/AppError');

/**
 * ============================================================================
 *  PLAN GATING MIDDLEWARE
 * ============================================================================
 *
 * Enforces plan limits and feature access on the backend, reading the current
 * tenant's plan (req.tenant.plan) against the planConfig.
 *
 * This is the server-side half of the gating. The frontend also hides locked
 * features, but NEVER trust the frontend: these middlewares are what actually
 * protect premium features from being used on a lower plan (e.g. via direct
 * API calls).
 *
 * Usage:
 *   router.post('/newsletter', requireFeature('newsletter'), handler);
 *   router.post('/products', enforceLimit('products', countProducts), handler);
 */

/**
 * Blocks the route unless the tenant's plan includes the given boolean feature.
 */
function requireFeature(feature) {
  return (req, res, next) => {
    const plan = req.tenant?.plan;
    if (!hasFeature(plan, feature)) {
      return next(
        new AppError(
          `Your current plan does not include this feature. Upgrade to unlock it.`,
          403
        )
      );
    }
    next();
  };
}

/**
 * Blocks creation when the tenant has reached the limit for a resource.
 *
 * `countFn` is an async function (req) => currentCount that returns how many
 * of the resource the tenant already has. Kept generic so it works for
 * products, categories, admin users, coupons, etc.
 */
function enforceLimit(resource, countFn) {
  return async (req, res, next) => {
    try {
      const plan = req.tenant?.plan;
      const currentCount = await countFn(req);
      if (!isUnderLimit(plan, resource, currentCount)) {
        const limit = getLimit(plan, resource);
        return next(
          new AppError(
            `You have reached your plan limit of ${limit} ${resource}. Upgrade to add more.`,
            403
          )
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireFeature, enforceLimit };
