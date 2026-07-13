/**
 * ============================================================================
 *  PLAN CONFIGURATION  --  SINGLE SOURCE OF TRUTH FOR PLANS
 * ============================================================================
 *
 * This object drives EVERYTHING related to plans:
 *  - Backend gating (middleware reads req.tenant.plan and checks against this)
 *  - Frontend feature visibility (show/hide options per plan)
 *  - The pricing table on the SaaS landing
 *
 * To change what a plan offers, you change it HERE and nowhere else.
 *
 * Limits use -1 to mean "unlimited".
 * Prices are in USD per month (display only; actual billing handled by the
 * payment provider). Adjust freely.
 *
 * The "multi-store" feature (one panel -> many stores) was intentionally LEFT
 * OUT of the MVP, as agreed. It can be added later as an enterprise add-on.
 */

const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Para emprendedores y tiendas nuevas",
    price: { monthly: 30000, yearly: 300000 },
    limits: {
      products: 50,
      imagesPerProduct: 5,
      categories: 10,
      adminUsers: 1, // owner only
      coupons: 5,
    },
    features: {
      // Storefront
      themes: ["starter-dark"],
      customColors: false,
      customDomain: false,
      // Operations
      orders: true,
      inventory: true,
      customers: true,
      // Marketing (locked)
      coupons: true,
      newsletter: false,
      popups: false,
      promotions: false,
      abandonedCart: false,
      // Analytics
      basicDashboard: true,
      advancedAnalytics: false,
      salesByChannel: false,
      // Integrations
      mercadoPago: true,
      whatsapp: true,
      // Premium
      ai: false,
      prioritySupport: false,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Para negocios en crecimiento",
    price: { monthly: 150000, yearly: 1500000 },
    popular: true, // highlight on the pricing table
    limits: {
      products: 1000,
      imagesPerProduct: 10,
      categories: 50,
      adminUsers: 5,
      coupons: 100,
    },
    features: {
      themes: ["premium-light", "premium-dark"],
      customColors: true,
      customDomain: false,
      orders: true,
      inventory: true,
      customers: true,
      coupons: true,
      newsletter: true,
      popups: true,
      promotions: true,
      abandonedCart: true,
      basicDashboard: true,
      advancedAnalytics: true,
      salesByChannel: true,
      mercadoPago: true,
      whatsapp: true,
      ai: false,
      prioritySupport: false,
    },
  },

  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Para marcas fuertes y empresas",
    price: { monthly: 350000, yearly: 3500000 },
    limits: {
      products: -1, // unlimited
      imagesPerProduct: 20,
      categories: -1,
      adminUsers: -1,
      coupons: -1,
    },
    features: {
      themes: ["premium-light", "premium-dark"],
      customColors: true,
      customDomain: true, // white-label
      orders: true,
      inventory: true,
      customers: true,
      coupons: true,
      newsletter: true,
      popups: true,
      promotions: true,
      abandonedCart: true,
      basicDashboard: true,
      advancedAnalytics: true,
      salesByChannel: true,
      mercadoPago: true,
      whatsapp: true,
      ai: true, // predictions, recommendations
      prioritySupport: true,
    },
  },
};

// Order used to render the pricing table and to compare plan tiers.
const PLAN_ORDER = ["starter", "growth", "premium"];

/**
 * Returns the config for a given plan id, defaulting to starter if unknown.
 */
function getPlan(planId) {
  return PLANS[planId] || PLANS.starter;
}

/**
 * Checks if a plan has a boolean feature enabled.
 *   hasFeature('starter', 'newsletter') -> false
 */
function hasFeature(planId, feature) {
  const plan = getPlan(planId);
  return plan.features[feature] === true;
}

/**
 * Checks if a plan is allowed a given theme.
 */
function hasTheme(planId, theme) {
  const plan = getPlan(planId);
  return plan.features.themes.includes(theme);
}

/**
 * Returns the numeric limit for a resource (-1 means unlimited).
 *   getLimit('starter', 'products') -> 50
 */
function getLimit(planId, resource) {
  const plan = getPlan(planId);
  return plan.limits[resource] ?? 0;
}

/**
 * Returns true if a current count is still under the plan's limit for a resource.
 * Unlimited (-1) always returns true.
 */
function isUnderLimit(planId, resource, currentCount) {
  const limit = getLimit(planId, resource);
  if (limit === -1) return true;
  return currentCount < limit;
}

module.exports = {
  PLANS,
  PLAN_ORDER,
  getPlan,
  hasFeature,
  hasTheme,
  getLimit,
  isUnderLimit,
};
