import { describe, expect, it } from "vitest";
import {
  buildComparisonQuery,
  calculateComparison,
  parseComparisonSlugs,
} from "@/utils/comparison";
import type { ProvinceResponse } from "@/types/api";

const province = (slug: string, price: number | null): ProvinceResponse => ({
  province: slug,
  province_slug: slug,
  pertamina_updated_at: null,
  synced_at: "2026-01-01T00:00:00Z",
  products: [
    {
      product: "PERTALITE",
      price_rupiah: price,
      availability: price === null ? "unavailable" : "available",
    },
  ],
});

describe("comparison utilities", () => {
  it("filters invalid and duplicate URL slugs", () => {
    expect(
      parseComparisonSlugs(
        "aceh,aceh,nope,jawa-barat",
        new Set(["aceh", "jawa-barat"])
      )
    ).toEqual(["aceh", "jawa-barat"]);
  });

  it("calculates available-only statistics and differences", () => {
    const result = calculateComparison(
      [
        province("aceh", 10000),
        province("riau", 12000),
        province("papua", null),
      ],
      "PERTALITE"
    );
    expect(result.summary).toEqual({
      minimum: 10000,
      maximum: 12000,
      average: 11000,
      spread: 2000,
    });
    expect(result.rows[1].differencePercent).toBe(9.1);
    expect(result.rows[2].differenceFromAverage).toBeNull();
  });

  it("builds a bounded canonical query", () => {
    expect(
      buildComparisonQuery("PERTALITE", ["aceh"], "desc", "available", true)
    ).toBe(
      "product=PERTALITE&provinces=aceh&sort=desc&availability=available&group=region"
    );
  });
});
