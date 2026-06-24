/**
 * Theme metadata for the storefront theme system.
 *
 * The actual colors live in index.css as CSS variables under [data-theme='...'].
 * This file is the JS-side registry used by the admin appearance page.
 *
 * Themes now reflect the plan tiers:
 *  - starter-dark   : sober charcoal grey (Starter plan)
 *  - premium-light  : NOVA white base (Growth/Premium)
 *  - premium-dark   : NOVA dark elegant (Growth/Premium)
 *
 * Keep the ids in sync with index.css, backend/src/config/plans.js and
 * frontend/src/lib/planClient.js.
 */
export const THEMES = [
  {
    id: "starter-dark",
    name: "Gris",
    description:
      "Sobrio y elegante en gris oscuro. Incluido en el plan Starter.",
    swatches: ["#212121", "#2b2b2b", "#e0e0e0"],
    font: "Inter",
  },
  {
    id: "premium-light",
    name: "Premium Claro",
    description: "Base blanca, estilo Apple. Minimalista y premium.",
    swatches: ["#ffffff", "#171717", "#f5f5f5"],
    font: "Inter",
  },
  {
    id: "premium-dark",
    name: "Premium Oscuro",
    description: "Negro elegante, estilo Nothing/Apple. Sofisticado.",
    swatches: ["#0a0a0a", "#ffffff", "#1f1f1f"],
    font: "Inter",
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
