import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { useFuelStore } from "@/stores/fuel-store";
import type { Availability, Product, ProvinceResponse } from "@/types/api";

/**
 * Feature: fuel-price-dashboard, Property 2: Store Data Round-Trip
 *
 * For any valid ProvinceResponse object (containing province name, slug,
 * timestamps, and products array), storing it in the Fuel Store and then
 * reading it back SHALL produce an object deeply equal to the original.
 *
 * **Validates: Requirements 2.4**
 */
describe("Feature: fuel-price-dashboard, Property 2: Store Data Round-Trip", () => {
  const availabilityArb: fc.Arbitrary<Availability> = fc.oneof(
    fc.constant<Availability>("available"),
    fc.constant<Availability>("unavailable"),
    fc.constant<Availability>("unknown")
  );

  const productArb: fc.Arbitrary<Product> = fc.record({
    product: fc.string({ minLength: 1, maxLength: 50 }),
    price_rupiah: fc.oneof(fc.nat({ max: 1_000_000_000 }), fc.constant(null)),
    availability: availabilityArb,
  });

  const provinceResponseArb: fc.Arbitrary<ProvinceResponse> = fc.record({
    province: fc.string({ minLength: 1, maxLength: 100 }),
    province_slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,50}$/),
    pertamina_updated_at: fc
      .integer({
        min: new Date("2020-01-01").getTime(),
        max: new Date("2030-12-31").getTime(),
      })
      .map((ts) => new Date(ts).toISOString()),
    synced_at: fc
      .integer({
        min: new Date("2020-01-01").getTime(),
        max: new Date("2030-12-31").getTime(),
      })
      .map((ts) => new Date(ts).toISOString()),
    products: fc.array(productArb, { minLength: 0, maxLength: 20 }),
  });

  beforeEach(() => {
    useFuelStore.setState({
      index: null,
      indexLoading: false,
      indexError: null,
      provinces: {},
      provinceLoading: {},
      provinceError: {},
      national: null,
      nationalLoading: false,
      nationalError: null,
      retryCount: {},
    });
  });

  it("stores and retrieves ProvinceResponse with deep equality for any valid input", () => {
    fc.assert(
      fc.property(provinceResponseArb, (provinceResponse) => {
        // Reset store state between iterations
        useFuelStore.setState({
          provinces: {},
          provinceLoading: {},
          provinceError: {},
        });

        const slug = provinceResponse.province_slug;

        // Store the province data
        useFuelStore.setState({
          provinces: {
            ...useFuelStore.getState().provinces,
            [slug]: provinceResponse,
          },
        });

        // Read it back
        const retrieved = useFuelStore.getState().provinces[slug];

        // Assert deep equality
        expect(retrieved).toEqual(provinceResponse);
      }),
      { numRuns: 100 }
    );
  });
});
