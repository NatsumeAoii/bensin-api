import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { useFuelStore } from "@/stores/fuel-store";
import { ApiError } from "@/api/client";

/**
 * Feature: fuel-price-dashboard, Property 3: Error State Invariant
 *
 * For any API failure (network error, timeout, HTTP error, or parse error),
 * the resulting error state SHALL always contain both a non-empty error message
 * string and a retry action — never one without the other.
 *
 * **Validates: Requirements 2.5, 2.10**
 */
describe("Property 3: Error State Invariant — Message and Retry Always Paired", () => {
  const MAX_RETRY_COUNT = 3;

  const networkErr = fc.constant(
    new ApiError("Gagal memuat data", "NETWORK_ERROR")
  );
  const timeoutErr = fc.constant(
    new ApiError("Koneksi terlalu lama", "TIMEOUT")
  );
  const httpErr = fc
    .integer({ min: 400, max: 599 })
    .map((status) => new ApiError(`HTTP ${status}`, "HTTP_ERROR", status));
  const parseErr = fc.constant(
    new ApiError("Gagal memuat data", "PARSE_ERROR")
  );

  const arbitraryApiError = fc.oneof(networkErr, timeoutErr, httpErr, parseErr);

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchIndex: error state always has non-empty message and retry capability", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryApiError, async (error) => {
        // Reset store state between iterations
        useFuelStore.setState({
          index: null,
          indexLoading: false,
          indexError: null,
          retryCount: {},
        });

        // Mock apiClient.getIndex to reject with the generated error
        const { apiClient } = await import("@/api/client");
        vi.spyOn(apiClient, "getIndex").mockRejectedValue(error);

        // Call fetchIndex
        await useFuelStore.getState().fetchIndex();

        // Verify error state invariant
        const state = useFuelStore.getState();
        const indexError = state.indexError;

        // Error must be present
        expect(indexError).not.toBeNull();

        // Error message must be non-empty
        expect(indexError!.message).toBeTruthy();
        expect(indexError!.message.length).toBeGreaterThan(0);

        // Retry must still be possible (retryCount < MAX)
        const retryCount = state.retryCount["index"] ?? 0;
        expect(retryCount).toBeLessThan(MAX_RETRY_COUNT);

        vi.restoreAllMocks();
      }),
      { numRuns: 100 }
    );
  });

  it("fetchProvince: error state always has non-empty message and retry capability", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryApiError,
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        async (error, slug) => {
          // Reset store state between iterations
          useFuelStore.setState({
            provinces: {},
            provinceLoading: {},
            provinceError: {},
            retryCount: {},
          });

          // Mock apiClient.getProvince to reject with the generated error
          const { apiClient } = await import("@/api/client");
          vi.spyOn(apiClient, "getProvince").mockRejectedValue(error);

          // Call fetchProvince
          await useFuelStore.getState().fetchProvince(slug);

          // Verify error state invariant
          const state = useFuelStore.getState();
          const provinceError = state.provinceError[slug];

          // Error must be present
          expect(provinceError).not.toBeNull();
          expect(provinceError).not.toBeUndefined();

          // Error message must be non-empty
          expect(provinceError!.message).toBeTruthy();
          expect(provinceError!.message.length).toBeGreaterThan(0);

          // Retry must still be possible (retryCount < MAX)
          const retryCount = state.retryCount[`province:${slug}`] ?? 0;
          expect(retryCount).toBeLessThan(MAX_RETRY_COUNT);

          vi.restoreAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("fetchNational: error state always has non-empty message and retry capability", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryApiError, async (error) => {
        // Reset store state between iterations
        useFuelStore.setState({
          national: null,
          nationalLoading: false,
          nationalError: null,
          retryCount: {},
        });

        // Mock apiClient.getNational to reject with the generated error
        const { apiClient } = await import("@/api/client");
        vi.spyOn(apiClient, "getNational").mockRejectedValue(error);

        // Call fetchNational
        await useFuelStore.getState().fetchNational();

        // Verify error state invariant
        const state = useFuelStore.getState();
        const nationalError = state.nationalError;

        // Error must be present
        expect(nationalError).not.toBeNull();

        // Error message must be non-empty
        expect(nationalError!.message).toBeTruthy();
        expect(nationalError!.message.length).toBeGreaterThan(0);

        // Retry must still be possible (retryCount < MAX)
        const retryCount = state.retryCount["national"] ?? 0;
        expect(retryCount).toBeLessThan(MAX_RETRY_COUNT);

        vi.restoreAllMocks();
      }),
      { numRuns: 100 }
    );
  });
});
