import { create } from "zustand";
import { apiClient, ApiError } from "@/api/client";
import type {
  IndexResponse,
  NationalResponse,
  ProvinceResponse,
} from "@/types/api";

const MAX_RETRY_COUNT = 3;
const RETRY_RESET_MS = 30_000;

/** Module-level timers for retry count reset — not part of Zustand state. */
const retryResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface FuelState {
  // Index data
  index: IndexResponse | null;
  indexLoading: boolean;
  indexError: ApiError | null;

  // Province data (keyed by slug)
  provinces: Record<string, ProvinceResponse>;
  provinceLoading: Record<string, boolean>;
  provinceError: Record<string, ApiError | null>;

  // National data
  national: NationalResponse | null;
  nationalLoading: boolean;
  nationalError: ApiError | null;

  // Retry tracking per request key
  retryCount: Record<string, number>;

  // Actions
  fetchIndex: (bypassCache?: boolean) => Promise<void>;
  fetchProvince: (slug: string, bypassCache?: boolean) => Promise<void>;
  fetchNational: (bypassCache?: boolean) => Promise<void>;
  retry: (key: string) => Promise<void>;
}

/**
 * Parses a request key to determine which fetch to re-invoke.
 * Keys follow the format: "index", "province:{slug}", or "national".
 */
function parseRequestKey(key: string): {
  type: "index" | "province" | "national";
  slug?: string;
} {
  if (key === "index") return { type: "index" };
  if (key === "national") return { type: "national" };
  if (key.startsWith("province:")) {
    return { type: "province", slug: key.slice("province:".length) };
  }
  return { type: "index" };
}

/**
 * Schedules a retry count reset after RETRY_RESET_MS when the max is hit.
 */
function scheduleRetryReset(key: string, get: () => FuelState, set: (partial: Partial<FuelState>) => void): void {
  clearTimeout(retryResetTimers[key]);
  retryResetTimers[key] = setTimeout(() => {
    const state = get();
    set({ retryCount: { ...state.retryCount, [key]: 0 } });
  }, RETRY_RESET_MS);
}

export const useFuelStore = create<FuelState>((set, get) => ({
  // Initial state
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

  fetchIndex: async (bypassCache = false) => {
    const state = get();

    // Return cached data if available and not bypassing
    if (!bypassCache && state.index) return;

    const key = "index";

    // Check retry limit
    if ((state.retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

    set({ indexLoading: true, indexError: null });

    try {
      const data = await apiClient.getIndex();

      set({
        index: data,
        indexLoading: false,
        indexError: null,
        retryCount: { ...get().retryCount, [key]: 0 },
      });
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError("Gagal memuat data", "NETWORK_ERROR");

      const currentRetryCount = get().retryCount[key] ?? 0;
      const newRetryCount = currentRetryCount + 1;

      set({
        indexLoading: false,
        indexError: apiError,
        retryCount: { ...get().retryCount, [key]: newRetryCount },
      });

      if (newRetryCount >= MAX_RETRY_COUNT) {
        scheduleRetryReset(key, get, set);
      }
    }
  },

  fetchProvince: async (slug: string, bypassCache = false) => {
    const state = get();
    const key = `province:${slug}`;

    // Return cached data if available and not bypassing
    if (!bypassCache && state.provinces[slug]) return;

    // Check retry limit
    if ((state.retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

    set({
      provinceLoading: { ...get().provinceLoading, [slug]: true },
      provinceError: { ...get().provinceError, [slug]: null },
    });

    try {
      const data = await apiClient.getProvince(slug);

      set({
        provinces: { ...get().provinces, [slug]: data },
        provinceLoading: { ...get().provinceLoading, [slug]: false },
        provinceError: { ...get().provinceError, [slug]: null },
        retryCount: { ...get().retryCount, [key]: 0 },
      });
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError("Gagal memuat data", "NETWORK_ERROR");

      const currentRetryCount = get().retryCount[key] ?? 0;
      const newRetryCount = currentRetryCount + 1;
      const existingData = get().provinces[slug];

      set({
        provinceLoading: { ...get().provinceLoading, [slug]: false },
        provinceError: { ...get().provinceError, [slug]: apiError },
        retryCount: { ...get().retryCount, [key]: newRetryCount },
        // Preserve stale data if it exists
        ...(existingData
          ? { provinces: { ...get().provinces, [slug]: existingData } }
          : {}),
      });

      if (newRetryCount >= MAX_RETRY_COUNT) {
        scheduleRetryReset(key, get, set);
      }
    }
  },

  fetchNational: async (bypassCache = false) => {
    const state = get();
    const key = "national";

    // Return cached data if available and not bypassing
    if (!bypassCache && state.national) return;

    // Check retry limit
    if ((state.retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

    set({ nationalLoading: true, nationalError: null });

    try {
      const data = await apiClient.getNational();

      set({
        national: data,
        nationalLoading: false,
        nationalError: null,
        retryCount: { ...get().retryCount, [key]: 0 },
      });
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError("Gagal memuat data", "NETWORK_ERROR");

      const currentRetryCount = get().retryCount[key] ?? 0;
      const newRetryCount = currentRetryCount + 1;

      set({
        nationalLoading: false,
        nationalError: apiError,
        retryCount: { ...get().retryCount, [key]: newRetryCount },
      });

      if (newRetryCount >= MAX_RETRY_COUNT) {
        scheduleRetryReset(key, get, set);
      }
    }
  },

  retry: async (key: string) => {
    const state = get();

    // Check if retry limit reached
    if ((state.retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

    const { type, slug } = parseRequestKey(key);

    switch (type) {
      case "index":
        await get().fetchIndex(true);
        break;
      case "province":
        if (slug) {
          await get().fetchProvince(slug, true);
        }
        break;
      case "national":
        await get().fetchNational(true);
        break;
    }
  },
}));
