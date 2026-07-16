import { describe, it, expect } from "vitest";
import { getAdjacentSlugs } from "@/utils/province-nav";
import type { IndexProvinceEntry } from "@/types/api";

function makeEntry(name: string, slug: string): IndexProvinceEntry {
  return {
    name,
    slug,
    path: `/v1/provinsi/${slug}.json`,
    pertamina_updated_at: "2026-01-01T00:00:00Z",
    synced_at: "2026-01-01T00:00:00Z",
    products_count: 4,
    file_size_bytes: 1000,
  };
}

const provinces: IndexProvinceEntry[] = [
  makeEntry("Aceh", "aceh"),
  makeEntry("Bali", "bali"),
  makeEntry("DKI Jakarta", "dki-jakarta"),
  makeEntry("Jawa Barat", "jawa-barat"),
  makeEntry("Papua", "papua"),
];

describe("getAdjacentSlugs", () => {
  it("returns prev=null for the first province", () => {
    const result = getAdjacentSlugs(provinces, "aceh");
    expect(result.prev).toBeNull();
    expect(result.next).not.toBeNull();
    expect(result.next!.slug).toBe("bali");
    expect(result.index).toBe(0);
  });

  it("returns next=null for the last province", () => {
    const result = getAdjacentSlugs(provinces, "papua");
    expect(result.prev).not.toBeNull();
    expect(result.prev!.slug).toBe("jawa-barat");
    expect(result.next).toBeNull();
    expect(result.index).toBe(4);
  });

  it("returns both prev and next for a middle province", () => {
    const result = getAdjacentSlugs(provinces, "dki-jakarta");
    expect(result.prev!.slug).toBe("bali");
    expect(result.next!.slug).toBe("jawa-barat");
    expect(result.index).toBe(2);
  });

  it("returns both null and index=-1 for unknown slug", () => {
    const result = getAdjacentSlugs(provinces, "unknown-slug");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
    expect(result.index).toBe(-1);
  });

  it("returns both null for a single province list", () => {
    const single = [makeEntry("Aceh", "aceh")];
    const result = getAdjacentSlugs(single, "aceh");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
    expect(result.index).toBe(0);
  });

  it("returns both null for empty list", () => {
    const result = getAdjacentSlugs([], "aceh");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
    expect(result.index).toBe(-1);
  });

  it("sorts alphabetically by Indonesian locale", () => {
    const unsorted = [
      makeEntry("Jawa Barat", "jawa-barat"),
      makeEntry("Aceh", "aceh"),
      makeEntry("Bali", "bali"),
    ];
    const result = getAdjacentSlugs(unsorted, "bali");
    // After sort: Aceh, Bali, Jawa Barat
    expect(result.index).toBe(1);
    expect(result.prev!.slug).toBe("aceh");
    expect(result.next!.slug).toBe("jawa-barat");
  });
});
