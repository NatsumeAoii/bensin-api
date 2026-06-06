import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { useFuelStore } from "@/stores/fuel-store";

/**
 * Feature: fuel-price-dashboard, Property 4: Cache Invariant
 *
 * For any province slug that has been successfully fetched, a subsequent fetch
 * for the same slug (without explicit retry) SHALL return the cached data without
 * triggering a new network request. When retry is explicitly triggered, the cache
 * SHALL be bypassed and a new network request SHALL be made.
 *
 * **Validates: Requirements 2.9**
 */

vi.mock("@/api/client", () => {
  const ApiError = class ApiError extends Error {
    code: string;
    status?: number;
    constructor(message: string, code: string, status?: number) {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.status = status;
    }
  };

  return {
    ApiError,
    apiClient: {
      getIndex: vi.fn(),
      getProvince: vi.fn(),
      getNational: vi.fn(),
    },
  };
});

import { apiClient } from "@/api/client";

const mockedGetProvince = vi.mocked(apiClient.getProvince);

describe("Property 4: Cache Invariant", () => {
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
    vi.clearAllMocks();
  });

  it("cached province data is returned without a new network request; bypass on retry triggers a new request", async () => {
    const slugArb = fc
      .stringMatching(/^[a-z][a-z0-9-]{0,30}$/)
      .filter((s) => s.length > 0);

    await fc.assert(
      fc.asyncProperty(slugArb, async (slug) => {
        // Reset state and mocks for each iteration
        vi.clearAllMocks();

        const mockProvinceData = {
          province: slug,
          province_slug: slug,
          pertamina_updated_at: "2024-01-01T00:00:00Z",
          synced_at: "2024-01-01T00:00:00Z",
          products: [
            {
              product: "Pertalite",
              price_rupiah: 10000,
              availability: "available" as const,
            },
          ],
        };

        // Pre-populate the store with cached province data
        useFuelStore.setState({
          provinces: { [slug]: mockProvinceData },
          provinceLoading: {},
          provinceError: {},
          retryCount: {},
        });

        // Call fetchProvince without bypass — should use cache, NOT call API
        await useFuelStore.getState().fetchProvince(slug);
        expect(mockedGetProvince).not.toHaveBeenCalled();

        // Verify data is still in store (cache hit)
        const cachedData = useFuelStore.getState().provinces[slug];
        expect(cachedData).toEqual(mockProvinceData);

        // Now call fetchProvince with bypassCache=true — should call API
        const updatedData = {
          ...mockProvinceData,
          products: [
            {
              product: "Pertamax",
              price_rupiah: 12000,
              availability: "available" as const,
            },
          ],
        };
        mockedGetProvince.mockResolvedValueOnce(updatedData);

        await useFuelStore.getState().fetchProvince(slug, true);
        expect(mockedGetProvince).toHaveBeenCalledWith(slug);
        expect(mockedGetProvince).toHaveBeenCalledTimes(1);

        // Clean up for next iteration
        useFuelStore.setState({
          provinces: {},
          provinceLoading: {},
          provinceError: {},
          retryCount: {},
        });
      }),
      { numRuns: 100 }
    );
  });
});
