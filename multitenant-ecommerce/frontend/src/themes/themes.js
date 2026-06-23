/**
 * Theme metadata for the storefront theme system.
 *
 * The actual colors live in index.css as CSS variables under [data-theme='...'].
 * This file is the JS-side registry used by:
 *  - the admin theme picker (preview swatches, names, descriptions)
 *  - validation against the tenant's plan (which themes are allowed)
 *
 * Keep the ids in sync with index.css and with backend/src/config/plans.js.
 */
export const THEMES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Tech, limpio, con acento vibrante. Ideal para electrónica y gadgets.',
    // Preview swatches (approx, for the picker UI).
    swatches: ['#7c3aed', '#0a0a0b', '#f4f4f5'],
    font: 'Clash Display',
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Cálido, orgánico, en tonos beige. Ideal para cosmética y bienestar.',
    swatches: ['#5a4a3a', '#f7f3ec', '#d9e0cf'],
    font: 'Fraunces',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Suave, amigable, en lavanda. Ideal para lifestyle y moda.',
    swatches: ['#9b7ed8', '#faf8fd', '#d6efe2'],
    font: 'Cabinet Grotesk',
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
