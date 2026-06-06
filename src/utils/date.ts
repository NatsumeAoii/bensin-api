/**
 * Date formatting utility for the fuel price dashboard.
 * Formats sync timestamps as relative time (Indonesian locale) when recent,
 * or absolute date when older than 7 days.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> =
  [
    { unit: "day", ms: 24 * 60 * 60 * 1000 },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
    { unit: "second", ms: 1000 },
  ];

/**
 * Cached Intl.RelativeTimeFormat instance — avoids re-initializing ICU locale
 * data on every call. Safe to reuse since the formatter is stateless and
 * locale/options never change at runtime.
 */
let cachedRtf: Intl.RelativeTimeFormat | null = null;

function getRelativeTimeFormat(): Intl.RelativeTimeFormat {
  if (!cachedRtf) {
    cachedRtf = new Intl.RelativeTimeFormat("id", { numeric: "always" });
  }
  return cachedRtf;
}

/**
 * Formats a relative time difference using the largest appropriate unit.
 * Uses a cached Intl.RelativeTimeFormat with Indonesian ("id") locale.
 */
function formatRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const rtf = getRelativeTimeFormat();

  for (const { unit, ms } of RELATIVE_UNITS) {
    const value = Math.floor(diffMs / ms);
    if (value >= 1) {
      return rtf.format(-value, unit);
    }
  }

  // Less than 1 second ago
  return rtf.format(0, "second");
}

/**
 * Formats an ISO 8601 timestamp as relative time in Indonesian if < 7 days old,
 * otherwise as absolute date (e.g., "1 Jun 2026").
 *
 * @param isoString - ISO 8601 timestamp string
 * @param now - Optional current date for testability (defaults to new Date())
 * @returns Formatted date string
 */
export function formatSyncTime(
  isoString: string,
  now: Date = new Date()
): string {
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < SEVEN_DAYS_MS) {
    return formatRelativeTime(date, now);
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
