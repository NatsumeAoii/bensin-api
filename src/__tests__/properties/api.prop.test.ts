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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct province URL for any valid slug", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Matches isValidSlug: lowercase alphanumeric segments joined by single
        // hyphens, never leading/trailing/double hyphens.
        fc
          .stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .filter((s) => s.length <= 50),
        async (slug) => {
          const validProvince = {
            province: `Prov. ${slug}`,
            province_slug: slug,
            pertamina_updated_at: "2026-06-01T15:59:37.000Z",
            synced_at: "2026-06-07T10:52:30.000Z",
            products: [],
          };
          const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(
              new Response(JSON.stringify(validProvince), { status: 200 })
            );

          await apiClient.getProvince(slug);

          const expectedUrl = `/v1/provinsi/${slug}.json`;
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
