import type { HistoryPoint } from "@/types/api";

/**
 * Filters a product's change-event series to those within the selected range,
 * keeping the most recent point before the window so a step line starts at the
 * correct price rather than appearing to begin mid-chart.
 *
 * @param points - Chronological list of price-change events.
 * @param days   - Window size in days, or null for all-time (no filtering).
 * @param now    - Reference "now" (injectable for testing).
 */
export function filterByRange(
  points: HistoryPoint[],
  days: number | null,
  now: Date
): HistoryPoint[] {
  if (days === null || points.length === 0) return points;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;

  const within: HistoryPoint[] = [];
  let carry: HistoryPoint | null = null;
  for (const p of points) {
    const t = new Date(p.date).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= cutoff) {
      within.push(p);
    } else {
      carry = p; // last point before the window
    }
  }
  if (carry && (within.length === 0 || within[0].date !== carry.date)) {
    return [carry, ...within];
  }
  return within;
}
