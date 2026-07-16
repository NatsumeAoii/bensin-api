/**
 * Province sorting utilities for the National View.
 * Sorts provinces by product price with nulls placed last.
 */

import type { ProvinceResponse } from "@/types/api";

/**
 * Sorts provinces by the price of a specified product in ascending order.
 * Provinces where the product is not found or has a null price are placed at the end.
 *
 * Pre-builds a price lookup map to avoid repeated linear scans during sort
 * comparisons — O(n + n·log(n)) instead of O(n·p·log(n)) where p = products per province.
 *
 * Does not mutate the input array — returns a new sorted array.
 *
 * @example
 * sortByPrice(provinces, "Pertamax")
 * // Provinces sorted by Pertamax price ascending, nulls last
 */
export function sortByPrice(
  provinces: ProvinceResponse[],
  productName: string,
  direction: "asc" | "desc" = "asc"
): ProvinceResponse[] {
  // Build price map in O(n·p) — one pass over all products
  const priceMap = new Map<ProvinceResponse, number | null>();
  for (const province of provinces) {
    const product = province.products.find((p) => p.product === productName);
    priceMap.set(province, product?.price_rupiah ?? null);
  }

  const multiplier = direction === "asc" ? 1 : -1;

  return [...provinces].sort((a, b) => {
    const priceA = priceMap.get(a) ?? null;
    const priceB = priceMap.get(b) ?? null;

    if (priceA === null && priceB === null) return 0;
    if (priceA === null) return 1;
    if (priceB === null) return -1;

    return (priceA - priceB) * multiplier;
  });
}
