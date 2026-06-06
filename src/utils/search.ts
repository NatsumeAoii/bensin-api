/**
 * Province search/filter utilities.
 * Provides case-insensitive substring matching with input length cap.
 */

import type { IndexProvinceEntry } from "@/types/api";

/**
 * Filters provinces by name using case-insensitive substring match.
 * Input query is truncated to 100 characters before matching.
 * Returns all provinces when the query is empty or whitespace-only after truncation.
 *
 * @example
 * filterProvinces(provinces, "jawa")   // provinces with "jawa" in name
 * filterProvinces(provinces, "")       // all provinces (no filter)
 * filterProvinces(provinces, "XYZ")    // [] if no match
 */
export function filterProvinces(
  provinces: IndexProvinceEntry[],
  query: string
): IndexProvinceEntry[] {
  const normalized = query.slice(0, 100).toLowerCase();
  if (!normalized) return provinces;
  return provinces.filter((province) =>
    province.name.toLowerCase().includes(normalized)
  );
}
