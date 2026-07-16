import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { PriceGrid } from "@/components/PriceGrid";
import type { Product, Availability } from "@/types/api";
import { renderWithI18n } from "@/__tests__/test-utils";

/**
 * Feature: fuel-price-dashboard, Property 7: Price Grid Count Equals Products Length
 *
 * Validates: Requirements 4.3
 *
 * For any non-empty products array, the Price_Grid SHALL render exactly
 * products.length Price_Card components — no more, no fewer.
 */

const availability: fc.Arbitrary<Availability> = fc.oneof(
  fc.constant<Availability>("available"),
  fc.constant<Availability>("unavailable"),
  fc.constant<Availability>("unknown")
);

const product: fc.Arbitrary<Product> = fc.record({
  product: fc.string({ minLength: 1, maxLength: 50 }),
  price_rupiah: fc.oneof(fc.nat({ max: 1_000_000_000 }), fc.constant(null)),
  availability,
});

describe("Property 7: Price Grid Count Equals Products Length", () => {
  it("renders exactly products.length PriceCard (article) elements for any non-empty array", () => {
    fc.assert(
      fc.property(
        fc.array(product, { minLength: 1, maxLength: 20 }),
        (products) => {
          // Ensure unique product names to avoid React key collisions
          const uniqueProducts = products.reduce<Product[]>((acc, p, i) => {
            acc.push({ ...p, product: `${p.product}-${i}` });
            return acc;
          }, []);

          const { container } = renderWithI18n(<PriceGrid products={uniqueProducts} />);
          const articles = container.querySelectorAll("article");

          expect(articles.length).toBe(uniqueProducts.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
