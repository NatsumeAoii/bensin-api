import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractDistinctProducts, getProductColor } from "@/utils/products";
import type { ProvinceResponse, Product, Availability } from "@/types/api";

/**
 * Property 9: Distinct Product Name Extraction
 * Validates: Requirements 5.3
 *
 * For any NationalResponse containing a provinces array, extracting distinct
 * product names SHALL produce a list with no duplicates, where every name in
 * the result exists in at least one province's products array.
 */
describe("Feature: fuel-price-dashboard, Property 9: Distinct Product Name Extraction", () => {
  const availabilityArb: fc.Arbitrary<Availability> = fc.oneof(
    fc.constant<Availability>("available"),
    fc.constant<Availability>("unavailable"),
    fc.constant<Availability>("unknown")
  );

  // Use a small pool of product names to ensure overlapping products across provinces
  const productNamePool = [
    "Pertamax",
    "Pertalite",
    "Solar",
    "Pertamax Turbo",
    "Dexlite",
    "Pertamina Dex",
    "Bio Solar",
  ];

  const productNameArb: fc.Arbitrary<string> = fc.oneof(
    ...productNamePool.map((name) => fc.constant(name))
  );

  const productArb: fc.Arbitrary<Product> = fc.record({
    product: productNameArb,
    price_rupiah: fc.option(fc.nat({ max: 100_000_000 }), { nil: null }),
    availability: availabilityArb,
  });

  const provinceArb: fc.Arbitrary<ProvinceResponse> = fc.record({
    province: fc.string({ minLength: 1, maxLength: 30 }),
    province_slug: fc.string({ minLength: 1, maxLength: 30 }),
    pertamina_updated_at: fc.constant("2025-01-01T00:00:00Z"),
    synced_at: fc.constant("2025-01-01T00:00:00Z"),
    products: fc.array(productArb, { minLength: 1, maxLength: 10 }),
  });

  const provincesArb = fc.array(provinceArb, { minLength: 0, maxLength: 20 });

  it("(a) the result contains no duplicates", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const result = extractDistinctProducts(provinces);
        expect(result.length).toBe(new Set(result).size);
      }),
      { numRuns: 100 }
    );
  });

  it("(b) every name in the result exists in at least one province's products", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const result = extractDistinctProducts(provinces);

        for (const name of result) {
          const existsInSomeProvince = provinces.some((province) =>
            province.products.some((product) => product.product === name)
          );
          expect(existsInSomeProvince).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("(c) every product name in any province's products appears in the result", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const result = extractDistinctProducts(provinces);
        const resultSet = new Set(result);

        for (const province of provinces) {
          for (const product of province.products) {
            expect(resultSet.has(product.product)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 1: Product color completeness
 * Validates: Requirements 1.3, 1.5
 *
 * For each canonical product name produced by PRODUCT_CANONICAL_MAP values,
 * getProductColor(name.toLowerCase()) SHALL return a color pair NOT equal to the
 * fallback value { from: "#f97316", to: "#ea580c" }.
 */
describe("Feature: architecture-improvements, Property 1: Product color completeness", () => {
  // Canonical names from PRODUCT_CANONICAL_MAP (pipeline/config.py)
  const CANONICAL_PRODUCT_NAMES = [
    "PERTALITE",
    "PERTAMAX",
    "PERTAMAX TURBO",
    "PERTAMAX GREEN 95",
    "DEXLITE",
    "PERTAMINA DEX",
    "BIOSOLAR",
    "BIOSOLAR NON SUBSIDI",
  ];

  const FALLBACK_COLOR = { from: "#f97316", to: "#ea580c" };

  const canonicalNameArb = fc.constantFrom(...CANONICAL_PRODUCT_NAMES);

  it("every canonical product name has a dedicated color (not the fallback)", () => {
    fc.assert(
      fc.property(canonicalNameArb, (name) => {
        const color = getProductColor(name.toLowerCase());
        expect(color).not.toEqual(FALLBACK_COLOR);
      }),
      { numRuns: 100 }
    );
  });
});
