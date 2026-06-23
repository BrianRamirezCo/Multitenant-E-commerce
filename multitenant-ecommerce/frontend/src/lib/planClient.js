/**
 * Client-side mirror of the plan feature flags (backend/src/config/plans.js).
 *
 * Used ONLY for UI gating (show/hide/lock features). The backend is the real
 * enforcement layer — never trust this for security. Keep the feature flags in
 * sync with the backend config.
 *
 * Only the fields the frontend needs are mirrored here (feature booleans +
 * allowed themes). Numeric limits stay on the backend.
 */
const PLAN_FEATURES = {
  starter: {
    themes: ['minimal'],
    customColors: false,
    customDomain: false,
    newsletter: false,
    popups: false,
    promotions: false,
    advancedAnalytics: false,
    salesByChannel: false,
    ai: false,
    prioritySupport: false,
  },
  growth: {
    themes: ['minimal', 'natural', 'lavender'],
    customColors: true,
    customDomain: false,
    newsletter: true,
    popups: true,
    promotions: true,
    advancedAnalytics: true,
    salesByChannel: true,
    ai: false,
    prioritySupport: false,
  },
  premium: {
    themes: ['minimal', 'natural', 'lavender'],
    customColors: true,
    customDomain: true,
    newsletter: true,
    popups: true,
    promotions: true,
    advancedAnalytics: true,
    salesByChannel: true,
    ai: true,
    prioritySupport: true,
  },
};

export function hasFeatureClient(plan, feature) {
  const config = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  return config[feature] === true;
}

export function allowedThemesClient(plan) {
  const config = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  return config.themes;
}
