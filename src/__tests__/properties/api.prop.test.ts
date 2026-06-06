import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { apiClient } from "@/api/client";

/**
 * Feature: fuel-price-dashboard, Property 1: Province URL Construction
 *
 * For any valid province slug string (non-empty, lowercase, containing only [a-z0-9-]),
 * the API client SHALL construct the fetch URL as
 * `{BASE_URL}/v1/provinsi/{slug}.json`
 *
 * **Validates: Requirements 2.2**
 */
describe("Property 1: Province URL Construction", () => {
  const BASE_URL = "https://nasgunawann.github.io/bensin-api";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct province URL for any valid slug", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,50}$/),
        async (slug) => {
          const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ province: slug, products: [] }), {
              status: 200,
            })
          );

          await apiClient.getProvince(slug);

          const expectedUrl = `${BASE_URL}/v1/provinsi/${slug}.json`;
          expect(fetchSpy).toHaveBeenCalledWith(
            expectedUrl,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
          );

          fetchSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });
});
