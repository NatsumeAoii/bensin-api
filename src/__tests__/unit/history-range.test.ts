import { describe, it, expect } from "vitest";
import { filterByRange } from "@/utils/history-range";
import type { HistoryPoint } from "@/types/api";

const NOW = new Date("2026-06-30T00:00:00Z");

function point(date: string, price: number): HistoryPoint {
  return { date, price_rupiah: price };
}

describe("filterByRange", () => {
  it("returns the original list when days is null (all-time)", () => {
    const points = [point("2026-01-01", 10000), point("2026-05-01", 11000)];
    expect(filterByRange(points, null, NOW)).toEqual(points);
  });

  it("returns an empty list unchanged regardless of range", () => {
    expect(filterByRange([], 30, NOW)).toEqual([]);
  });

  it("keeps points within the window", () => {
    const points = [
      point("2026-06-10", 10000),
      point("2026-06-20", 11000),
      point("2026-06-29", 12000),
    ];
    const result = filterByRange(points, 30, NOW);
    expect(result).toEqual(points);
  });

  it("prepends the last point before the window as a step anchor", () => {
    const points = [
      point("2026-01-01", 9000), // before 30-day window
      point("2026-06-25", 12000), // inside
    ];
    const result = filterByRange(points, 30, NOW);
    expect(result).toEqual([
      point("2026-01-01", 9000),
      point("2026-06-25", 12000),
    ]);
  });

  it("returns only the carried anchor when all points precede the window", () => {
    const points = [point("2026-01-01", 9000), point("2026-02-01", 9500)];
    const result = filterByRange(points, 30, NOW);
    // The most recent pre-window point is carried as the single anchor.
    expect(result).toEqual([point("2026-02-01", 9500)]);
  });

  it("does not duplicate an anchor that already sits at the window edge", () => {
    const onEdge = point("2026-06-01", 10000); // within the 30-day window
    const points = [onEdge, point("2026-06-20", 11000)];
    const result = filterByRange(points, 30, NOW);
    expect(result).toEqual(points);
    // No duplicate leading entry.
    expect(result.filter((p) => p.date === onEdge.date)).toHaveLength(1);
  });

  it("skips points with unparseable dates", () => {
    const points = [point("not-a-date", 9999), point("2026-06-20", 11000)];
    const result = filterByRange(points, 30, NOW);
    expect(result).toEqual([point("2026-06-20", 11000)]);
  });

  it("handles a single point inside the window", () => {
    const points = [point("2026-06-15", 10000)];
    expect(filterByRange(points, 30, NOW)).toEqual(points);
  });
});
