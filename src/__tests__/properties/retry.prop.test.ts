import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { useFuelStore } from "@/stores/fuel-store";
import { ApiError } from "@/api/client";

/**
 * Feature: fuel-price-dashboard, Property 12: Retry Maximum Invariant
 *
 * For any fetch operation key, the retry mechanism SHALL allow re-attempts
 * while the consecutive failure count is less than 3. After exactly 3
 * consecutive failures, the retry action SHALL be disabled. A successful
 * fetch SHALL reset the failure count to 0.
 *
 * **Validates: Requirements 9.4**
 */

vi.mock("@/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/client")>("@/api/client");
  return {
    ...actual,
    apiClient: {
      getIndex: vi.fn(),
      getProvince: vi.fn(),
      getNational: vi.fn(),
    },
  };
});

import { apiClient } from "@/api/client";

const mockIndexResponse = {
  api_name: "bensin-api",
  version: "1.0",
  author: "test",
  github_repository: "https://github.com/test",
  synced_at: "2024-01-01T00:00:00Z",
  pertamina_updated_at: "2024-01-01T00:00:00Z",
  provinsi_count: 1,
  provinsi: {},
  endpoints: { all_provinces: "/v1/nasional.json" },
};

describe("Property 12: Retry Maximum Invariant", () => {
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
    vi.resetAllMocks();
  });

  it("allows retries while consecutive failures < 3, blocks after exactly 3, resets on success", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        async (sequence) => {
          // Reset store and mocks for each property check
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
          vi.mocked(apiClient.getIndex).mockReset();

          const key = "index";
          let consecutiveFailures = 0;

          for (const isSuccess of sequence) {
            if (isSuccess) {
              vi.mocked(apiClient.getIndex).mockResolvedValueOnce(
                mockIndexResponse
              );
            } else {
              vi.mocked(apiClient.getIndex).mockRejectedValueOnce(
                new ApiError("Gagal memuat data", "NETWORK_ERROR")
              );
            }

            const callCountBefore = vi.mocked(apiClient.getIndex).mock.calls
              .length;

            // Clear cached index so fetchIndex doesn't short-circuit on cache hit
            useFuelStore.setState({ index: null });
            await useFuelStore.getState().fetchIndex();

            const callCountAfter = vi.mocked(apiClient.getIndex).mock.calls
              .length;
            const wasCalled = callCountAfter > callCountBefore;

            if (consecutiveFailures >= 3) {
              // After 3 consecutive failures, retry SHALL be disabled
              expect(wasCalled).toBe(false);
            } else {
              // While consecutive failures < 3, retry SHALL be allowed
              expect(wasCalled).toBe(true);

              if (isSuccess) {
                // Success resets failure count to 0
                consecutiveFailures = 0;
                expect(useFuelStore.getState().retryCount[key]).toBe(0);
              } else {
                consecutiveFailures++;
                expect(useFuelStore.getState().retryCount[key]).toBe(
                  consecutiveFailures
                );
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("a successful fetch always resets failure count to 0 regardless of prior failures", async () => {
    await fc.assert(
      fc.asyncProperty(fc.nat({ max: 2 }), async (failuresBefore) => {
        // Reset store and mocks
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
        vi.mocked(apiClient.getIndex).mockReset();

        const key = "index";

        // Simulate `failuresBefore` consecutive failures
        for (let i = 0; i < failuresBefore; i++) {
          vi.mocked(apiClient.getIndex).mockRejectedValueOnce(
            new ApiError("Gagal memuat data", "NETWORK_ERROR")
          );
          useFuelStore.setState({ index: null });
          await useFuelStore.getState().fetchIndex();
        }

        expect(useFuelStore.getState().retryCount[key] ?? 0).toBe(
          failuresBefore
        );

        // Now a successful fetch should reset the count
        vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndexResponse);
        useFuelStore.setState({ index: null });
        await useFuelStore.getState().fetchIndex();

        expect(useFuelStore.getState().retryCount[key]).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("after exactly 3 consecutive failures, the retry action is disabled", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Reset store and mocks
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
        vi.mocked(apiClient.getIndex).mockReset();

        const key = "index";

        // Cause exactly 3 failures
        for (let i = 0; i < 3; i++) {
          vi.mocked(apiClient.getIndex).mockRejectedValueOnce(
            new ApiError("Gagal memuat data", "NETWORK_ERROR")
          );
          useFuelStore.setState({ index: null });
          await useFuelStore.getState().fetchIndex();
        }

        expect(useFuelStore.getState().retryCount[key]).toBe(3);

        // Now retry should be blocked — apiClient should NOT be called
        vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndexResponse);
        const callsBefore = vi.mocked(apiClient.getIndex).mock.calls.length;

        await useFuelStore.getState().retry(key);

        const callsAfter = vi.mocked(apiClient.getIndex).mock.calls.length;
        expect(callsAfter).toBe(callsBefore);
      }),
      { numRuns: 100 }
    );
  });
});
