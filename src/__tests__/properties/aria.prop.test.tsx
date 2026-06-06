import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { PriceCard } from "@/components/PriceCard";
import { formatPrice } from "@/utils/format";
import type { Product, Availability } from "@/types/api";

/**
 * Property 13: PriceCard Aria-Label Completeness
 * Validates: Requirements 10.5
 *
 * For any Product object, the rendered PriceCard component's aria-label attribute
 * SHALL contain: (a) the product name, (b) the formatted price string (or "Tidak Tersedia"
 * when price_rupiah is null), and (c) the availability status text.
 */

const availabilityLabels: Record<Availability, string> = {
  available: "Tersedia",
  unavailable: "Tidak Tersedia",
  unknown: "Tidak Diketahui",
};

const productArbitrary: fc.Arbitrary<Product> = fc.record({
  product: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price_rupiah: fc.oneof(fc.nat({ max: 1_000_000_000 }), fc.constant(null)),
  availability: fc.constantFrom<Availability>("available", "unavailable", "unknown"),
});

describe("Feature: fuel-price-dashboard, Property 13: PriceCard Aria-Label Completeness", () => {
  it("PriceCard aria-label contains product name, formatted price, and availability status for any Product", () => {
    fc.assert(
      fc.property(productArbitrary, (product) => {
        const { unmount } = render(<PriceCard product={product} />);

        const article = screen.getByRole("article");
        const ariaLabel = article.getAttribute("aria-label");

        expect(ariaLabel).not.toBeNull();

        // (a) aria-label contains the product name
        expect(ariaLabel).toContain(product.product);

        // (b) aria-label contains the formatted price string
        const expectedPrice = formatPrice(product.price_rupiah);
        expect(ariaLabel).toContain(expectedPrice);

        // (c) aria-label contains the availability status text
        const expectedAvailability = availabilityLabels[product.availability];
        expect(ariaLabel).toContain(expectedAvailability);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
