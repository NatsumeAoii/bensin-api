import { describe, it, expect } from "vitest";
import { filterProvinces } from "@/utils/search";
import type { IndexProvinceEntry } from "@/types/api";

function makeProvince(name: string): IndexProvinceEntry {
  return {
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    path: `/v1/provinsi/${name.toLowerCase().replace(/\s+/g, "-")}.json`,
    pertamina_updated_at: "2024-01-01T00:00:00Z",
    synced_at: "2024-01-01T00:00:00Z",
    products_count: 9,
    file_size_bytes: 1024,
  };
}

const provinces: IndexProvinceEntry[] = [
  makeProvince("Jawa Barat"),
  makeProvince("Jawa Tengah"),
  makeProvince("Jawa Timur"),
  makeProvince("Bali"),
  makeProvince("DKI Jakarta"),
];

describe("filterProvinces", () => {
  it("returns all provinces when query is empty", () => {
    const result = filterProvinces(provinces, "");
    expect(result).toEqual(provinces);
  });

  it("filters by case-insensitive substring match", () => {
    const result = filterProvinces(provinces, "jawa");
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.name)).toEqual([
      "Jawa Barat",
      "Jawa Tengah",
      "Jawa Timur",
    ]);
  });

  it("matches case-insensitively with uppercase query", () => {
    const result = filterProvinces(provinces, "BALI");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bali");
  });

  it("returns empty array when no provinces match", () => {
    const result = filterProvinces(provinces, "xyz");
    expect(result).toEqual([]);
  });

  it("truncates query to 100 characters", () => {
    const longQuery = "a".repeat(200);
    const result = filterProvinces(provinces, longQuery);
    expect(result).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = [...provinces];
    filterProvinces(provinces, "jawa");
    expect(provinces).toEqual(original);
  });

  it("matches partial substrings", () => {
    const result = filterProvinces(provinces, "jak");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("DKI Jakarta");
  });
});
