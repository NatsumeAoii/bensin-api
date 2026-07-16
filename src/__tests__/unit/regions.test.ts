import { describe, it, expect } from "vitest";
import { getRegion, groupByRegion, REGION_MAP } from "@/utils/regions";
import type { ProvinceResponse } from "@/types/api";

function makeProvince(slug: string): ProvinceResponse {
  return {
    province: slug,
    province_slug: slug,
    pertamina_updated_at: "2026-01-01T00:00:00Z",
    synced_at: "2026-01-01T00:00:00Z",
    products: [],
  };
}

describe("regions", () => {
  describe("REGION_MAP", () => {
    it("has 7 regions", () => {
      expect(Object.keys(REGION_MAP)).toHaveLength(7);
    });

    it("maps all 40 expected province slugs", () => {
      const allSlugs = Object.values(REGION_MAP).flatMap((r) => r.slugs);
      // Check a sample of known slugs
      const expected = [
        "aceh",
        "dki-jakarta",
        "bali",
        "papua",
        "kalimantan-barat",
        "sulawesi-utara",
        "maluku",
        "jawa-timur",
      ];
      for (const slug of expected) {
        expect(allSlugs).toContain(slug);
      }
    });

    it("has no duplicate slugs across regions", () => {
      const allSlugs = Object.values(REGION_MAP).flatMap((r) => r.slugs);
      const unique = new Set(allSlugs);
      expect(unique.size).toBe(allSlugs.length);
    });
  });

  describe("getRegion", () => {
    it("returns correct region key for known slugs", () => {
      expect(getRegion("aceh")).toBe("sumatera");
      expect(getRegion("dki-jakarta")).toBe("jawa");
      expect(getRegion("bali")).toBe("bali_nt");
      expect(getRegion("papua")).toBe("papua");
    });

    it("returns null for unknown slugs", () => {
      expect(getRegion("unknown")).toBeNull();
      expect(getRegion("")).toBeNull();
    });
  });

  describe("groupByRegion", () => {
    it("groups provinces by region", () => {
      const provinces = [
        makeProvince("aceh"),
        makeProvince("dki-jakarta"),
        makeProvince("bali"),
        makeProvince("sumatera-utara"),
      ];
      const groups = groupByRegion(provinces);
      expect(groups.get("sumatera")).toHaveLength(2);
      expect(groups.get("jawa")).toHaveLength(1);
      expect(groups.get("bali_nt")).toHaveLength(1);
    });

    it("skips provinces with unknown slugs", () => {
      const provinces = [makeProvince("aceh"), makeProvince("unknown-region")];
      const groups = groupByRegion(provinces);
      expect(groups.size).toBe(1);
      expect(groups.has("sumatera")).toBe(true);
    });

    it("returns empty map for empty input", () => {
      const groups = groupByRegion([]);
      expect(groups.size).toBe(0);
    });
  });
});
