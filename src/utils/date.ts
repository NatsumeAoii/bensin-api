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

const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormat(locale: string): Intl.RelativeTimeFormat {
  let rtf = rtfCache.get(locale);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
    rtfCache.set(locale, rtf);
  }
  return rtf;
}

function formatRelativeTime(date: Date, now: Date, locale: string): string {
  const diffMs = now.getTime() - date.getTime();
  const rtf = getRelativeTimeFormat(locale);

  for (const { unit, ms } of RELATIVE_UNITS) {
    const value = Math.floor(diffMs / ms);
    if (value >= 1) {
      return rtf.format(-value, unit);
    }
  }

  return rtf.format(0, "second");
}

/**
 * Formats an ISO 8601 timestamp as relative time if < 7 days old,
 * otherwise as absolute date.
 *
 * @param isoString - ISO 8601 timestamp string
 * @param now - Optional current date for testability (defaults to new Date())
 * @param locale - BCP 47 locale tag (defaults to "id")
 * @returns Formatted date string
 */
export function formatSyncTime(
  isoString: string,
  now: Date = new Date(),
  locale: string = "id"
): string {
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < SEVEN_DAYS_MS) {
    return formatRelativeTime(date, now, locale);
  }

  return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
