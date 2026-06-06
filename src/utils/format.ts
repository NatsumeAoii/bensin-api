/**
 * Currency formatting utilities for Indonesian Rupiah.
 * Uses Indonesian locale (id-ID) with period as thousands separator.
 */

/**
 * Cached Intl.NumberFormat instance — avoids re-initializing ICU locale
 * data on every call. Safe to reuse since the formatter is stateless.
 */
let cachedNumberFormat: Intl.NumberFormat | null = null;

function getNumberFormat(): Intl.NumberFormat {
  if (!cachedNumberFormat) {
    cachedNumberFormat = new Intl.NumberFormat("id-ID");
  }
  return cachedNumberFormat;
}

/**
 * Formats an integer price value as Indonesian Rupiah.
 * Uses period as thousands grouping separator with "Rp " prefix.
 *
 * @example
 * formatRupiah(12600) // "Rp 12.600"
 * formatRupiah(0)     // "Rp 0"
 */
export function formatRupiah(price: number): string {
  return `Rp ${getNumberFormat().format(price)}`;
}

/**
 * Formats a price for display, handling null (unavailable) case.
 * Returns "Tidak Tersedia" when price is null, otherwise delegates to formatRupiah.
 *
 * @example
 * formatPrice(12600) // "Rp 12.600"
 * formatPrice(null)  // "Tidak Tersedia"
 */
export function formatPrice(price: number | null): string {
  if (price === null) return "Tidak Tersedia";
  return formatRupiah(price);
}
