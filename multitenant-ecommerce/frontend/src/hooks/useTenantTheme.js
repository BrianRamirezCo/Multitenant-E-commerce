import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

/**
 * Applies a theme to the document via the data-theme attribute on <html>.
 *
 * IMPORTANT — theme scope:
 *   The plan-based theme (grey for Starter, premium for Growth/Premium) must
 *   only affect the STOREFRONT (what customers see). The admin panel is a work
 *   tool and should always look the same, regardless of the tenant's plan.
 *
 *   So: on /store routes we apply the tenant's plan theme; everywhere else
 *   (admin, landing) we apply a fixed neutral theme (premium-light) so the
 *   admin UI stays consistent.
 *
 * PLAN GATING (storefront only): the plan decides which themes are allowed. If
 * the tenant's saved theme isn't allowed by their plan, we fall back to the
 * plan's default. The plan drives the storefront look.
 */

// Which themes each plan can use, and the default for each plan.
const PLAN_THEMES = {
  starter: { allowed: ["starter-dark"], default: "starter-dark" },
  growth: {
    allowed: ["premium-light", "premium-dark"],
    default: "premium-light",
  },
  premium: {
    allowed: ["premium-light", "premium-dark"],
    default: "premium-light",
  },
};

// Fixed theme for the admin panel & landing (never changes with the plan).
const ADMIN_THEME = "premium-light";

function resolveStorefrontTheme(plan, savedTheme) {
  const config = PLAN_THEMES[plan] || PLAN_THEMES.starter;
  if (savedTheme && config.allowed.includes(savedTheme)) {
    return savedTheme;
  }
  return config.default;
}

/**
 * Converts a #RRGGBB hex string to "H S% L%" channels (shadcn variable format).
 * Returns null on invalid input so we can safely skip.
 */
function hexToHslChannels(hex) {
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
}

export function useTenantTheme() {
  const tenant = useSelector((s) => s.tenant.info);
  const location = useLocation();

  useEffect(() => {
    // Only the storefront follows the tenant's plan theme.
    const isStorefront = location.pathname.startsWith("/store");

    if (isStorefront) {
      const plan = tenant?.plan || "starter";
      const savedTheme = tenant?.theme?.name;
      const theme = resolveStorefrontTheme(plan, savedTheme);
      document.documentElement.setAttribute("data-theme", theme);

      // Custom primary color (Growth/Premium only). Starter never overrides.
      const custom = tenant?.theme?.primaryColor;
      const channels = hexToHslChannels(custom);
      if (channels && plan !== "starter") {
        document.documentElement.style.setProperty("--primary", channels);
        document.documentElement.style.setProperty("--ring", channels);
      } else {
        document.documentElement.style.removeProperty("--primary");
        document.documentElement.style.removeProperty("--ring");
      }
    } else {
      // Admin panel & landing: fixed neutral theme, no custom color.
      document.documentElement.setAttribute("data-theme", ADMIN_THEME);
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
    }
  }, [tenant, location.pathname]);
}
