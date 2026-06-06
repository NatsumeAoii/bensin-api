import { describe, it } from "vitest";
import * as fc from "fast-check";
import { formatSyncTime } from "@/utils/date";

/**
 * Property 6: Date Formatting Threshold
 * Feature: fuel-price-dashboard, Property 6: Date Formatting Threshold
 *
 * **Validates: Requirements 4.2**
 *
 * For any ISO 8601 timestamp, the `formatSyncTime` function SHALL produce
 * a relative time string (e.g., "2 jam yang lalu") when the timestamp is
 * less than 7 days before the current time, and an absolute date string
 * (e.g., "1 Jun 2026") when the timestamp is 7 or more days old.
 */
describe("Feature: fuel-price-dashboard, Property 6: Date Formatting Threshold", () => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Indonesian relative time indicators
  const RELATIVE_TIME_WORDS = ["detik", "menit", "jam", "hari"];

  const containsRelativeTimeWord = (str: string): boolean =>
    RELATIVE_TIME_WORDS.some((word) => str.includes(word));

  // Fixed "now" for deterministic testing
  const fixedNow = new Date("2026-06-15T12:00:00.000Z");

  // Generator for timestamps less than 7 days before `now`
  const recentTimestampArb = fc
    .integer({ min: 0, max: SEVEN_DAYS_MS - 1 })
    .map((diffMs) => new Date(fixedNow.getTime() - diffMs));

  // Generator for timestamps 7 or more days before `now`
  // Constrain to a reasonable range: 7 days to ~10 years before now
  const oldTimestampArb = fc
    .integer({ min: SEVEN_DAYS_MS, max: 10 * 365 * 24 * 60 * 60 * 1000 })
    .map((diffMs) => new Date(fixedNow.getTime() - diffMs));

  it("produces a relative time string containing Indonesian time words when timestamp is less than 7 days old", () => {
    fc.assert(
      fc.property(recentTimestampArb, (timestamp) => {
        const result = formatSyncTime(timestamp.toISOString(), fixedNow);

        // Result must contain at least one Indonesian relative time indicator
        return containsRelativeTimeWord(result);
      }),
      { numRuns: 100 }
    );
  });

  it("produces an absolute date string with year and no relative time words when timestamp is 7 or more days old", () => {
    fc.assert(
      fc.property(oldTimestampArb, (timestamp) => {
        const result = formatSyncTime(timestamp.toISOString(), fixedNow);

        // Result must NOT contain relative time words
        const hasNoRelativeWords = !containsRelativeTimeWord(result);

        // Result must contain the year number from the timestamp
        const year = timestamp.getFullYear().toString();
        const containsYear = result.includes(year);

        return hasNoRelativeWords && containsYear;
      }),
      { numRuns: 100 }
    );
  });
});
