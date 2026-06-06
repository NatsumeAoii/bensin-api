import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { filterProvinces } from "@/utils/search";
import type { IndexProvinceEntry } from "@/types/api";

/**
 * Feature: fuel-price-dashboard, Property 5: Province Search Filter
 *
 * Validates: Requirements 3.4, 3.5, 5.5
 *
 * For any list of provinces and any search input string (including strings
 * exceeding 100 characters), the filter function SHALL:
 * (a) truncate the input to 100 characters,
 * (b) return only provinces whose name contains the truncated search text
 *     as a case-insensitive substring, and
 * (c) return all provinces when the search text is empty.
 */

const provinceEntry: fc.Arbitrary<IndexProvinceEntry> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 80 }),
  slug: fc.string({ minLength: 1, maxLength: 60 }).map((s) =>
    s.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  ),
  path: fc.string({ minLength: 1, maxLength: 100 }),
  pertamina_updated_at: fc.constant("2024-01-01T00:00:00Z"),
  synced_at: fc.constant("2024-01-01T00:00:00Z"),
  products_count: fc.nat({ max: 20 }),
  file_size_bytes: fc.nat({ max: 100000 }),
});

describe("Property 5: Province Search Filter", () => {
  it("(a) long queries (>100 chars) produce same result as query truncated to 100", () => {
    fc.assert(
      fc.property(
        fc.array(provinceEntry, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 101, maxLength: 300 }),
        (provinces, longQuery) => {
          const resultFull = filterProvinces(provinces, longQuery);
          const resultTruncated = filterProvinces(
            provinces,
            longQuery.slice(0, 100)
          );
          expect(resultFull).toEqual(resultTruncated);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("(b) all returned provinces contain the query as case-insensitive substring in their name", () => {
    fc.assert(
      fc.property(
        fc.array(provinceEntry, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (provinces, query) => {
          const result = filterProvinces(provinces, query);
          const normalizedQuery = query.slice(0, 100).toLowerCase();

          for (const province of result) {
            expect(province.name.toLowerCase()).toContain(normalizedQuery);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("(c) empty query returns the original array unchanged", () => {
    fc.assert(
      fc.property(
        fc.array(provinceEntry, { minLength: 0, maxLength: 30 }),
        (provinces) => {
          const result = filterProvinces(provinces, "");
          expect(result).toEqual(provinces);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("result is always a subset of the input array", () => {
    fc.assert(
      fc.property(
        fc.array(provinceEntry, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 0, maxLength: 150 }),
        (provinces, query) => {
          const result = filterProvinces(provinces, query);

          for (const province of result) {
            expect(provinces).toContainEqual(province);
          }
          expect(result.length).toBeLessThanOrEqual(provinces.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
