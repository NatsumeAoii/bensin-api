import { describe, it, expect } from "vitest";
import { buildChangeFeed } from "@/utils/history-feed";
import type { HistoryPoint } from "@/types/api";

function pt(date: string, price: number): HistoryPoint {
  return { date, price_rupiah: price };
}

describe("buildChangeFeed", () => {
  it("returns empty for empty histories", () => {
    expect(buildChangeFeed([])).toEqual([]);
  });

  it("returns empty when no prices change", () => {
    const result = buildChangeFeed([
      {
        slug: "aceh",
        name: "Aceh",
        products: {
          Pertalite: [pt("2026-01-01", 10000), pt("2026-02-01", 10000)],
        },
      },
    ]);
    expect(result).toEqual([]);
  });

  it("emits one event for two different prices", () => {
    const result = buildChangeFeed([
      {
        slug: "aceh",
        name: "Aceh",
        products: {
          Pertalite: [pt("2026-01-01", 10000), pt("2026-02-01", 12000)],
        },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-02-01",
      province: "Aceh",
      province_slug: "aceh",
      product: "Pertalite",
      old_price: 10000,
      new_price: 12000,
      change_absolute: 2000,
    });
    expect(result[0].change_percent).toBe(20);
  });

  it("emits no event when all prices are the same", () => {
    const result = buildChangeFeed([
      {
        slug: "bali",
        name: "Bali",
        products: {
          Solar: [
            pt("2026-01-01", 6800),
            pt("2026-03-01", 6800),
            pt("2026-06-01", 6800),
          ],
        },
      },
    ]);
    expect(result).toEqual([]);
  });

  it("sorts by date descending then province name", () => {
    const result = buildChangeFeed([
      {
        slug: "bali",
        name: "Bali",
        products: {
          Pertalite: [pt("2026-01-01", 10000), pt("2026-03-01", 11000)],
        },
      },
      {
        slug: "aceh",
        name: "Aceh",
        products: {
          Pertalite: [pt("2026-01-01", 10000), pt("2026-06-01", 12000)],
        },
      },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-06-01");
    expect(result[0].province).toBe("Aceh");
    expect(result[1].date).toBe("2026-03-01");
    expect(result[1].province).toBe("Bali");
  });

  it("handles multiple products per province", () => {
    const result = buildChangeFeed([
      {
        slug: "aceh",
        name: "Aceh",
        products: {
          Pertalite: [pt("2026-01-01", 10000), pt("2026-02-01", 11000)],
          Solar: [pt("2026-01-01", 6800), pt("2026-02-01", 7000)],
        },
      },
    ]);
    expect(result).toHaveLength(2);
    const products = result.map((e) => e.product).sort();
    expect(products).toEqual(["Pertalite", "Solar"]);
  });

  it("computes negative change for price decrease", () => {
    const result = buildChangeFeed([
      {
        slug: "bali",
        name: "Bali",
        products: {
          Pertalite: [pt("2026-01-01", 12000), pt("2026-02-01", 10000)],
        },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].change_absolute).toBe(-2000);
    expect(result[0].change_percent).toBeCloseTo(-16.67, 1);
  });
});
