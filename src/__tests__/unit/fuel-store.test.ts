import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFuelStore } from "@/stores/fuel-store";
import { ApiError } from "@/api/client";
import type {
  IndexResponse,
  NationalResponse,
  ProvinceResponse,
} from "@/types/api";

// Mock the API client
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

const mockIndex: IndexResponse = {
  api_name: "bensin-api",
  version: "1.0",
  author: "test",
  github_repository: "https://github.com/test",
  synced_at: "2024-01-01T00:00:00Z",
  pertamina_updated_at: "2024-01-01T00:00:00Z",
  provinsi_count: 1,
  provinsi: {
    "jawa-barat": {
      name: "Jawa Barat",
      slug: "jawa-barat",
      path: "/v1/provinsi/jawa-barat.json",
      pertamina_updated_at: "2024-01-01T00:00:00Z",
      synced_at: "2024-01-01T00:00:00Z",
      products_count: 9,
      file_size_bytes: 1024,
    },
  },
  endpoints: { all_provinces: "/v1/nasional.json" },
};

const mockProvince: ProvinceResponse = {
  province: "Jawa Barat",
  province_slug: "jawa-barat",
  pertamina_updated_at: "2024-01-01T00:00:00Z",
  synced_at: "2024-01-01T00:00:00Z",
  products: [
    { product: "Pertalite", price_rupiah: 10000, availability: "available" },
  ],
};

const mockNational: NationalResponse = {
  version: "1.0",
  synced_at: "2024-01-01T00:00:00Z",
  pertamina_updated_at: "2024-01-01T00:00:00Z",
  provinces: [mockProvince],
};

describe("Fuel Store", () => {
  beforeEach(() => {
    // Reset store state before each test
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

  describe("fetchIndex", () => {
    it("fetches and stores index data", async () => {
      vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndex);

      await useFuelStore.getState().fetchIndex();

      const state = useFuelStore.getState();
      expect(state.index).toEqual(mockIndex);
      expect(state.indexLoading).toBe(false);
      expect(state.indexError).toBeNull();
    });

    it("returns cached data without fetching", async () => {
      useFuelStore.setState({ index: mockIndex });

      await useFuelStore.getState().fetchIndex();

      expect(apiClient.getIndex).not.toHaveBeenCalled();
    });

    it("sets error state on failure", async () => {
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      vi.mocked(apiClient.getIndex).mockRejectedValueOnce(error);

      await useFuelStore.getState().fetchIndex();

      const state = useFuelStore.getState();
      expect(state.index).toBeNull();
      expect(state.indexLoading).toBe(false);
      expect(state.indexError).toEqual(error);
      expect(state.retryCount["index"]).toBe(1);
    });

    it("increments retry count on each failure", async () => {
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      vi.mocked(apiClient.getIndex).mockRejectedValue(error);

      await useFuelStore.getState().fetchIndex();
      expect(useFuelStore.getState().retryCount["index"]).toBe(1);

      await useFuelStore.getState().fetchIndex();
      expect(useFuelStore.getState().retryCount["index"]).toBe(2);

      await useFuelStore.getState().fetchIndex();
      expect(useFuelStore.getState().retryCount["index"]).toBe(3);
    });

    it("stops fetching after max retry count", async () => {
      useFuelStore.setState({ retryCount: { index: 3 } });
      vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndex);

      await useFuelStore.getState().fetchIndex();

      expect(apiClient.getIndex).not.toHaveBeenCalled();
    });
  });

  describe("fetchProvince", () => {
    it("fetches and stores province data", async () => {
      vi.mocked(apiClient.getProvince).mockResolvedValueOnce(mockProvince);

      await useFuelStore.getState().fetchProvince("jawa-barat");

      const state = useFuelStore.getState();
      expect(state.provinces["jawa-barat"]).toEqual(mockProvince);
      expect(state.provinceLoading["jawa-barat"]).toBe(false);
      expect(state.provinceError["jawa-barat"]).toBeNull();
    });

    it("returns cached province without fetching", async () => {
      useFuelStore.setState({ provinces: { "jawa-barat": mockProvince } });

      await useFuelStore.getState().fetchProvince("jawa-barat");

      expect(apiClient.getProvince).not.toHaveBeenCalled();
    });

    it("bypasses cache when bypassCache is true", async () => {
      useFuelStore.setState({ provinces: { "jawa-barat": mockProvince } });
      vi.mocked(apiClient.getProvince).mockResolvedValueOnce(mockProvince);

      await useFuelStore.getState().fetchProvince("jawa-barat", true);

      expect(apiClient.getProvince).toHaveBeenCalledWith("jawa-barat");
    });

    it("preserves stale data on refresh failure", async () => {
      useFuelStore.setState({ provinces: { "jawa-barat": mockProvince } });
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      vi.mocked(apiClient.getProvince).mockRejectedValueOnce(error);

      await useFuelStore.getState().fetchProvince("jawa-barat", true);

      const state = useFuelStore.getState();
      expect(state.provinces["jawa-barat"]).toEqual(mockProvince);
      expect(state.provinceError["jawa-barat"]).toEqual(error);
    });

    it("sets error state on failure", async () => {
      const error = new ApiError("Koneksi terlalu lama", "TIMEOUT");
      vi.mocked(apiClient.getProvince).mockRejectedValueOnce(error);

      await useFuelStore.getState().fetchProvince("bali");

      const state = useFuelStore.getState();
      expect(state.provinceError["bali"]).toEqual(error);
      expect(state.provinceLoading["bali"]).toBe(false);
      expect(state.retryCount["province:bali"]).toBe(1);
    });

    it("hydrates province from cached national data without a network call", async () => {
      useFuelStore.setState({ national: mockNational });

      await useFuelStore.getState().fetchProvince("jawa-barat");

      const state = useFuelStore.getState();
      expect(state.provinces["jawa-barat"]).toEqual(mockProvince);
      expect(apiClient.getProvince).not.toHaveBeenCalled();
    });

    it("fetches from network when national lacks the requested province", async () => {
      useFuelStore.setState({ national: mockNational });
      vi.mocked(apiClient.getProvince).mockResolvedValueOnce({
        ...mockProvince,
        province: "Bali",
        province_slug: "bali",
      });

      await useFuelStore.getState().fetchProvince("bali");

      expect(apiClient.getProvince).toHaveBeenCalledWith("bali");
    });
  });

  describe("fetchNational", () => {
    it("fetches and stores national data", async () => {
      vi.mocked(apiClient.getNational).mockResolvedValueOnce(mockNational);

      await useFuelStore.getState().fetchNational();

      const state = useFuelStore.getState();
      expect(state.national).toEqual(mockNational);
      expect(state.nationalLoading).toBe(false);
      expect(state.nationalError).toBeNull();
    });

    it("returns cached national data without fetching", async () => {
      useFuelStore.setState({ national: mockNational });

      await useFuelStore.getState().fetchNational();

      expect(apiClient.getNational).not.toHaveBeenCalled();
    });

    it("bypasses cache when bypassCache is true", async () => {
      useFuelStore.setState({ national: mockNational });
      vi.mocked(apiClient.getNational).mockResolvedValueOnce(mockNational);

      await useFuelStore.getState().fetchNational(true);

      expect(apiClient.getNational).toHaveBeenCalled();
    });

    it("sets error state on failure", async () => {
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      vi.mocked(apiClient.getNational).mockRejectedValueOnce(error);

      await useFuelStore.getState().fetchNational();

      const state = useFuelStore.getState();
      expect(state.national).toBeNull();
      expect(state.nationalLoading).toBe(false);
      expect(state.nationalError).toEqual(error);
      expect(state.retryCount["national"]).toBe(1);
    });
  });

  describe("retry", () => {
    it("retries index fetch by clearing cache", async () => {
      useFuelStore.setState({ retryCount: { index: 1 } });
      vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndex);

      await useFuelStore.getState().retry("index");

      const state = useFuelStore.getState();
      expect(state.index).toEqual(mockIndex);
      expect(apiClient.getIndex).toHaveBeenCalled();
    });

    it("retries province fetch with bypassCache", async () => {
      useFuelStore.setState({
        provinces: { "jawa-barat": mockProvince },
        retryCount: { "province:jawa-barat": 1 },
      });
      vi.mocked(apiClient.getProvince).mockResolvedValueOnce(mockProvince);

      await useFuelStore.getState().retry("province:jawa-barat");

      expect(apiClient.getProvince).toHaveBeenCalledWith("jawa-barat");
    });

    it("retries national fetch with bypassCache", async () => {
      useFuelStore.setState({
        national: mockNational,
        retryCount: { national: 2 },
      });
      vi.mocked(apiClient.getNational).mockResolvedValueOnce(mockNational);

      await useFuelStore.getState().retry("national");

      expect(apiClient.getNational).toHaveBeenCalled();
    });

    it("does not retry when max retry count reached", async () => {
      useFuelStore.setState({ retryCount: { index: 3 } });

      await useFuelStore.getState().retry("index");

      expect(apiClient.getIndex).not.toHaveBeenCalled();
    });

    it("resets retry count on successful fetch", async () => {
      useFuelStore.setState({ retryCount: { national: 2 } });
      vi.mocked(apiClient.getNational).mockResolvedValueOnce(mockNational);

      await useFuelStore.getState().retry("national");

      expect(useFuelStore.getState().retryCount["national"]).toBe(0);
    });
  });

  describe("error handling", () => {
    it("wraps non-ApiError into ApiError", async () => {
      vi.mocked(apiClient.getIndex).mockRejectedValueOnce(
        new Error("unknown error")
      );

      await useFuelStore.getState().fetchIndex();

      const state = useFuelStore.getState();
      expect(state.indexError).not.toBeNull();
      expect(state.indexError?.message).toBe("Gagal memuat data");
    });

    it("always pairs error with non-zero retry capability", async () => {
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      vi.mocked(apiClient.getIndex).mockRejectedValueOnce(error);

      await useFuelStore.getState().fetchIndex();

      const state = useFuelStore.getState();
      expect(state.indexError).not.toBeNull();
      expect(state.indexError?.message).toBeTruthy();
      // Retry is still possible (count < max)
      expect(state.retryCount["index"]).toBeLessThan(3);
    });
  });

  describe("retry-count reset timer", () => {
    it("re-enables fetching after the reset window once the max is hit", async () => {
      vi.useFakeTimers();
      try {
        const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
        vi.mocked(apiClient.getIndex).mockRejectedValue(error);

        // Exhaust the retry budget.
        await useFuelStore.getState().fetchIndex();
        await useFuelStore.getState().fetchIndex();
        await useFuelStore.getState().fetchIndex();
        expect(useFuelStore.getState().retryCount["index"]).toBe(3);

        // While exhausted, fetches are blocked.
        await useFuelStore.getState().fetchIndex();
        expect(apiClient.getIndex).toHaveBeenCalledTimes(3);

        // After the reset window, the count clears and fetching resumes.
        await vi.advanceTimersByTimeAsync(30_000);
        expect(useFuelStore.getState().retryCount["index"]).toBe(0);

        vi.mocked(apiClient.getIndex).mockResolvedValueOnce(mockIndex);
        await useFuelStore.getState().fetchIndex();
        expect(useFuelStore.getState().index).toEqual(mockIndex);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
