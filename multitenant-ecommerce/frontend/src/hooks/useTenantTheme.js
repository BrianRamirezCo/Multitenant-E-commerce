import { useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * Applies the current tenant's theme to the document.
 *
 * Two layers:
 *  1. data-theme attribute on <html> -> selects one of the three theme palettes
 *     defined in index.css (minimal / natural / lavender).
 *  2. Optional custom primary color (Growth/Premium) -> overrides --primary at
 *     runtime, layered on top of the chosen theme.
 *
 * The tenant's theme + customColor come from the tenant info in Redux,
 * populated from /tenant/me on load.
 */

/**
 * Converts a #RRGGBB hex string to "H S% L%" channels (shadcn variable format).
 * Returns null on invalid input so we can safely skip.
 */
function hexToHslChannels(hex) {
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
  const h = hex.replace('#', '');
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
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
}

export function useTenantTheme() {
  const tenant = useSelector((s) => s.tenant.info);

  useEffect(() => {
    const theme = tenant?.theme?.name || 'minimal';
    document.documentElement.setAttribute('data-theme', theme);

    // Optional per-tenant custom primary color (overrides the theme default).
    const custom = tenant?.theme?.primaryColor;
    const channels = hexToHslChannels(custom);
    if (channels) {
      document.documentElement.style.setProperty('--primary', channels);
      document.documentElement.style.setProperty('--ring', channels);
    } else {
      // Clear any previous override so the theme default applies.
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--ring');
    }
  }, [tenant]);
}
