import type { Availability, ProvinceResponse } from "@/types/api";

export const MAX_COMPARISON_PROVINCES = 12;

export interface ComparisonRow {
  province: ProvinceResponse;
  price: number | null;
  availability: Availability | "missing";
  differenceFromAverage: number | null;
  differencePercent: number | null;
}

export interface ComparisonSummary {
  minimum: number | null;
  maximum: number | null;
  average: number | null;
  spread: number | null;
}

export function parseComparisonSlugs(
  value: string | null,
  validSlugs: Set<string>
): string[] {
  if (!value) return [];
  return [...new Set(value.split(","))]
    .filter((slug) => validSlugs.has(slug))
    .slice(0, MAX_COMPARISON_PROVINCES);
}

export function calculateComparison(
  provinces: ProvinceResponse[],
  product: string
): { summary: ComparisonSummary; rows: ComparisonRow[] } {
  const rows = provinces.map((province) => {
    const item = province.products.find((entry) => entry.product === product);
    return {
      province,
      price: item?.availability === "available" ? item.price_rupiah : null,
      availability: item?.availability ?? "missing",
      differenceFromAverage: null,
      differencePercent: null,
    };
  });
  const prices = rows.flatMap((row) => (row.price === null ? [] : [row.price]));
  const average = prices.length
    ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    : null;
  const minimum = prices.length ? Math.min(...prices) : null;
  const maximum = prices.length ? Math.max(...prices) : null;
  const summary = {
    minimum,
    maximum,
    average,
    spread: minimum === null || maximum === null ? null : maximum - minimum,
  };
  return {
    summary,
    rows: rows.map((row) => ({
      ...row,
      differenceFromAverage:
        row.price === null || average === null ? null : row.price - average,
      differencePercent:
        row.price === null || average === null || average === 0
          ? null
          : Math.round(((row.price - average) / average) * 1000) / 10,
    })),
  };
}

export function buildComparisonQuery(
  product: string,
  slugs: string[],
  sort: "asc" | "desc",
  availability: "all" | "available" | "unavailable",
  group: boolean
): string {
  const params = new URLSearchParams();
  if (product) params.set("product", product);
  if (slugs.length)
    params.set("provinces", slugs.slice(0, MAX_COMPARISON_PROVINCES).join(","));
  if (sort === "desc") params.set("sort", sort);
  if (availability !== "all") params.set("availability", availability);
  if (group) params.set("group", "region");
  return params.toString();
}
