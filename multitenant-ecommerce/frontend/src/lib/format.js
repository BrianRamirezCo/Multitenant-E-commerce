/**
 * Formats a price stored in the smallest currency unit (cents) into a
 * localized currency string.
 *
 *   formatPrice(129999, 'ARS') -> "$1.299,99"
 *
 * Backend stores prices as integers (cents) to avoid float rounding bugs,
 * so we divide by 100 here for display only.
 */
export function formatPrice(cents, currency = 'ARS', locale = 'es-AR') {
  const amount = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if the currency code is invalid.
    return `$${amount.toFixed(2)}`;
  }
}
