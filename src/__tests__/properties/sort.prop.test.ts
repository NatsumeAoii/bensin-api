import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortByPrice } from "@/utils/sort";
import type { ProvinceResponse, Product, Availability } from "@/types/api";

/**
 * Property 10: Price Sort with Nulls Last
 * Validates: Requirements 5.4
 *
 * For any list of provinces with a selected product, sorting by price_rupiah
 * SHALL produce a list where:
 * (a) all entries with non-null prices appear before all entries with null prices
 * (b) the non-null entries are ordered in non-decreasing order of price_rupiah
 * (c) the output has the same length as input
 * (d) does not mutate the original array
 */
describe("Feature: fuel-price-dashboard, Property 10: Price Sort with Nulls Last", () => {
  const PRODUCT_NAME = "Pertamax";

  const availabilityArb: fc.Arbitrary<Availability> = fc.oneof(
    fc.constant<Availability>("available"),
    fc.constant<Availability>("unavailable"),
    fc.constant<Availability>("unknown")
  );

  const productArb = (name: string): fc.Arbitrary<Product> =>
    fc.record({
      product: fc.constant(name),
      price_rupiah: fc.option(fc.nat({ max: 100_000_000 }), { nil: null }),
      availability: availabilityArb,
    });

  const provinceArb: fc.Arbitrary<ProvinceResponse> = fc.record({
    province: fc.string({ minLength: 1, maxLength: 30 }),
    province_slug: fc.string({ minLength: 1, maxLength: 30 }),
    pertamina_updated_at: fc.constant("2025-01-01T00:00:00Z"),
    synced_at: fc.constant("2025-01-01T00:00:00Z"),
    products: fc.tuple(productArb(PRODUCT_NAME)).map(([target]) => [target]),
  });

  const provincesArb = fc.array(provinceArb, { minLength: 0, maxLength: 30 });

  it("(a) after sorting, no null-price entry appears before a non-null-price entry", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const sorted = sortByPrice(provinces, PRODUCT_NAME);

        const prices = sorted.map(
          (p) =>
            p.products.find((prod) => prod.product === PRODUCT_NAME)
              ?.price_rupiah ?? null
        );

        let seenNull = false;
        for (const price of prices) {
          if (price === null) {
            seenNull = true;
          } else if (seenNull) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("(b) non-null prices are in non-decreasing order", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const sorted = sortByPrice(provinces, PRODUCT_NAME);

        const nonNullPrices = sorted
          .map(
            (p) =>
              p.products.find((prod) => prod.product === PRODUCT_NAME)
                ?.price_rupiah ?? null
          )
          .filter((price): price is number => price !== null);

        for (let i = 1; i < nonNullPrices.length; i++) {
          if (nonNullPrices[i] < nonNullPrices[i - 1]) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("(c) the output has the same length as input", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const sorted = sortByPrice(provinces, PRODUCT_NAME);
        expect(sorted).toHaveLength(provinces.length);
      }),
      { numRuns: 100 }
    );
  });

  it("(d) does not mutate the original array", () => {
    fc.assert(
      fc.property(provincesArb, (provinces) => {
        const original = [...provinces];
        sortByPrice(provinces, PRODUCT_NAME);

        expect(provinces).toEqual(original);
      }),
      { numRuns: 100 }
    );
  });
});
