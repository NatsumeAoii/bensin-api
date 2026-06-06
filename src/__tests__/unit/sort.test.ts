import { describe, it, expect } from "vitest";
import { sortByPrice } from "@/utils/sort";
import type { ProvinceResponse, Product } from "@/types/api";

function makeProvince(
  name: string,
  products: Product[]
): ProvinceResponse {
  return {
    province: name,
    province_slug: name.toLowerCase().replace(/\s+/g, "-"),
    pertamina_updated_at: "2024-01-01T00:00:00Z",
    synced_at: "2024-01-01T00:00:00Z",
    products,
  };
}

function makeProduct(
  name: string,
  price: number | null
): Product {
  return {
    product: name,
    price_rupiah: price,
    availability: price !== null ? "available" : "unavailable",
  };
}

describe("sortByPrice", () => {
  const provinces: ProvinceResponse[] = [
    makeProvince("Bali", [makeProduct("Pertamax", 13000)]),
    makeProvince("Jawa Barat", [makeProduct("Pertamax", 12500)]),
    makeProvince("Papua", [makeProduct("Pertamax", null)]),
    makeProvince("DKI Jakarta", [makeProduct("Pertamax", 12800)]),
  ];

  it("sorts provinces by product price ascending", () => {
    const result = sortByPrice(provinces, "Pertamax");
    const prices = result.map(
      (p) => p.products.find((pr) => pr.product === "Pertamax")?.price_rupiah
    );
    expect(prices).toEqual([12500, 12800, 13000, null]);
  });

  it("places provinces with null prices last", () => {
    const result = sortByPrice(provinces, "Pertamax");
    expect(result[result.length - 1].province).toBe("Papua");
  });

  it("places provinces missing the product last (treated as null)", () => {
    const provincesWithMissing: ProvinceResponse[] = [
      makeProvince("Bali", [makeProduct("Pertamax", 13000)]),
      makeProvince("Jawa Barat", [makeProduct("Solar", 6800)]),
      makeProvince("DKI Jakarta", [makeProduct("Pertamax", 12800)]),
    ];
    const result = sortByPrice(provincesWithMissing, "Pertamax");
    expect(result[result.length - 1].province).toBe("Jawa Barat");
  });

  it("does not mutate the input array", () => {
    const original = [...provinces];
    sortByPrice(provinces, "Pertamax");
    expect(provinces).toEqual(original);
  });

  it("handles all null prices without error", () => {
    const allNull: ProvinceResponse[] = [
      makeProvince("A", [makeProduct("Pertamax", null)]),
      makeProvince("B", [makeProduct("Pertamax", null)]),
    ];
    const result = sortByPrice(allNull, "Pertamax");
    expect(result).toHaveLength(2);
  });

  it("handles empty provinces array", () => {
    const result = sortByPrice([], "Pertamax");
    expect(result).toEqual([]);
  });

  it("returns stable order for equal prices", () => {
    const equalPrices: ProvinceResponse[] = [
      makeProvince("A", [makeProduct("Pertamax", 12500)]),
      makeProvince("B", [makeProduct("Pertamax", 12500)]),
      makeProvince("C", [makeProduct("Pertamax", 12500)]),
    ];
    const result = sortByPrice(equalPrices, "Pertamax");
    expect(result.map((p) => p.province)).toEqual(["A", "B", "C"]);
  });
});
