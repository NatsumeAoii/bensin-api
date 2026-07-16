import { describe, it, expect } from "vitest";
import { computeHistoryStats } from "@/utils/history-stats";
import type { HistoryPoint } from "@/types/api";

function pt(date: string, price: number): HistoryPoint {
  return { date, price_rupiah: price };
}

describe("computeHistoryStats", () => {
  it("returns null for an empty series", () => {
    expect(computeHistoryStats([])).toBeNull();
  });

  it("returns zero change for a single point", () => {
    const stats = computeHistoryStats([pt("2026-01-01", 10000)]);
    expect(stats).toEqual({
      startPrice: 10000,
      endPrice: 10000,
      changeAbsolute: 0,
      changePercent: 0,
      pointCount: 1,
    });
  });

  it("computes correct delta for multiple points", () => {
    const stats = computeHistoryStats([
      pt("2026-01-01", 10000),
      pt("2026-03-01", 12000),
      pt("2026-06-01", 11000),
    ]);
    expect(stats).not.toBeNull();
    expect(stats!.startPrice).toBe(10000);
    expect(stats!.endPrice).toBe(11000);
    expect(stats!.changeAbsolute).toBe(1000);
    expect(stats!.changePercent).toBe(10);
    expect(stats!.pointCount).toBe(3);
  });

  it("returns 0% when all prices are the same", () => {
    const stats = computeHistoryStats([
      pt("2026-01-01", 12600),
      pt("2026-03-01", 12600),
      pt("2026-06-01", 12600),
    ]);
    expect(stats).not.toBeNull();
    expect(stats!.changeAbsolute).toBe(0);
    expect(stats!.changePercent).toBe(0);
  });

  it("handles negative change (price decrease)", () => {
    const stats = computeHistoryStats([
      pt("2026-01-01", 12000),
      pt("2026-06-01", 10000),
    ]);
    expect(stats).not.toBeNull();
    expect(stats!.changeAbsolute).toBe(-2000);
    expect(stats!.changePercent).toBeCloseTo(-16.666, 1);
  });
});
