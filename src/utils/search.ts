/**
 * Province search/filter utilities.
 * Provides case-insensitive substring matching with input length cap.
 */

import type { IndexProvinceEntry } from "@/types/api";

const MAX_QUERY_LENGTH = 100;

/**
 * Generic case-insensitive substring filter over an arbitrary list, selecting
 * the searchable text from each item. The query is truncated to 100 characters
 * before matching. Returns all items when the query is empty or whitespace-only
 * after truncation.
 *
 * @example
 * filterByName(provinces, (p) => p.name, "jawa")
 */
export function filterByName<T>(
  items: T[],
  getName: (item: T) => string,
  query: string
): T[] {
  const normalized = query.slice(0, MAX_QUERY_LENGTH).toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    getName(item).toLowerCase().includes(normalized)
  );
}

/**
 * Filters index province entries by name using case-insensitive substring match.
 * Thin wrapper over {@link filterByName} preserved for existing call sites.
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
  return filterByName(provinces, (p) => p.name, query);
}
