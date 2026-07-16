import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getAdjacentSlugs } from "@/utils/province-nav";
import type { IndexProvinceEntry } from "@/types/api";

function makeEntry(slug: string): IndexProvinceEntry {
  return {
    name: slug,
    slug,
    path: `/v1/provinsi/${slug}.json`,
    pertamina_updated_at: "2026-01-01T00:00:00Z",
    synced_at: "2026-01-01T00:00:00Z",
    products_count: 4,
    file_size_bytes: 1000,
  };
}

const slugArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-z][a-z0-9-]*$/.test(s));

describe("getAdjacentSlugs (property)", () => {
  it("index is always in [0, length) for a present slug", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(slugArb, { minLength: 1, maxLength: 20 }),
        (slugs) => {
          const entries = slugs.map(makeEntry);
          for (const entry of entries) {
            const result = getAdjacentSlugs(entries, entry.slug);
            expect(result.index).toBeGreaterThanOrEqual(0);
            expect(result.index).toBeLessThan(entries.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("prev and next are always valid entries or null", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(slugArb, { minLength: 1, maxLength: 20 }),
        (slugs) => {
          const entries = slugs.map(makeEntry);
          for (const entry of entries) {
            const result = getAdjacentSlugs(entries, entry.slug);
            if (result.prev) {
              expect(result.prev.slug).toBeTruthy();
              expect(result.prev.name).toBeTruthy();
            }
            if (result.next) {
              expect(result.next.slug).toBeTruthy();
              expect(result.next.name).toBeTruthy();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
