import { create } from "zustand";
import { apiClient, ApiError } from "@/api/client";
import { buildChangeFeed } from "@/utils/history-feed";
import type {
  IndexResponse,
  NationalResponse,
  PriceChangeEvent,
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

  // History feed data
  historyFeed: PriceChangeEvent[] | null;
  historyFeedLoading: boolean;
  historyFeedError: ApiError | null;
  historyFeedSyncedAt: string | null;

  // Retry tracking per request key
  retryCount: Record<string, number>;

  // Actions
  fetchIndex: (bypassCache?: boolean) => Promise<void>;
  fetchProvince: (slug: string, bypassCache?: boolean) => Promise<void>;
  fetchNational: (bypassCache?: boolean) => Promise<void>;
  fetchHistoryFeed: (bypassCache?: boolean) => Promise<void>;
  retry: (key: string) => Promise<void>;
}

type StoreSet = (partial: Partial<FuelState>) => void;
type StoreGet = () => FuelState;

/**
 * Parses a request key to determine which fetch to re-invoke.
 * Keys follow the format: "index", "province:{slug}", or "national".
 */
function parseRequestKey(key: string): {
  type: "index" | "province" | "national" | "historyFeed";
  slug?: string;
} {
  if (key === "index") return { type: "index" };
  if (key === "national") return { type: "national" };
  if (key === "historyFeed") return { type: "historyFeed" };
  if (key.startsWith("province:")) {
    return { type: "province", slug: key.slice("province:".length) };
  }
  return { type: "index" };
}

/**
 * Schedules a retry count reset after RETRY_RESET_MS when the max is hit, so a
 * user stranded by transient failures can try again once the window elapses.
 */
function scheduleRetryReset(key: string, get: StoreGet, set: StoreSet): void {
  clearTimeout(retryResetTimers[key]);
  retryResetTimers[key] = setTimeout(() => {
    const state = get();
    set({ retryCount: { ...state.retryCount, [key]: 0 } });
  }, RETRY_RESET_MS);
}

/** Normalizes any thrown value into an ApiError. */
function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError("Gagal memuat data", "NETWORK_ERROR");
}

/**
 * Shared fetch orchestration: cache short-circuit, retry-limit gate, loading
 * flag management, success/failure state application, and retry-reset
 * scheduling. Extracting this keeps the three resource fetchers identical in
 * behavior and removes ~3x duplicated control flow.
 *
 * @param key          Retry-tracking key ("index", "national", "province:slug").
 * @param hasCache     Whether cached data exists (skips fetch unless bypassed).
 * @param bypassCache  Force a network fetch even when cached.
 * @param fetcher      Performs the network request.
 * @param onStart      Sets the loading flag(s) and clears prior error.
 * @param onSuccess    Applies fetched data and clears loading/error.
 * @param onError      Applies the error and clears loading.
 */
async function runFetch<T>(
  key: string,
  hasCache: boolean,
  bypassCache: boolean,
  get: StoreGet,
  set: StoreSet,
  fetcher: () => Promise<T>,
  onStart: () => void,
  onSuccess: (data: T) => void,
  onError: (error: ApiError) => void
): Promise<void> {
  if (!bypassCache && hasCache) return;
  if ((get().retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

  onStart();

  try {
    const data = await fetcher();
    onSuccess(data);
    set({ retryCount: { ...get().retryCount, [key]: 0 } });
  } catch (error) {
    const apiError = toApiError(error);
    const newRetryCount = (get().retryCount[key] ?? 0) + 1;
    onError(apiError);
    set({ retryCount: { ...get().retryCount, [key]: newRetryCount } });
    if (newRetryCount >= MAX_RETRY_COUNT) {
      scheduleRetryReset(key, get, set);
    }
  }
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

  historyFeed: null,
  historyFeedLoading: false,
  historyFeedError: null,
  historyFeedSyncedAt: null,

  retryCount: {},

  fetchIndex: (bypassCache = false) =>
    runFetch(
      "index",
      get().index !== null,
      bypassCache,
      get,
      set,
      () => apiClient.getIndex(),
      () => set({ indexLoading: true, indexError: null }),
      (data) => set({ index: data, indexLoading: false, indexError: null }),
      (error) => set({ indexLoading: false, indexError: error })
    ),

  fetchProvince: (slug: string, bypassCache = false) => {
    const key = `province:${slug}`;

    // Hydrate from already-fetched national data to skip a redundant request.
    if (!bypassCache && !get().provinces[slug]) {
      const fromNational = get().national?.provinces.find(
        (p) => p.province_slug === slug
      );
      if (fromNational) {
        set({ provinces: { ...get().provinces, [slug]: fromNational } });
        return Promise.resolve();
      }
    }

    return runFetch(
      key,
      get().provinces[slug] !== undefined,
      bypassCache,
      get,
      set,
      () => apiClient.getProvince(slug),
      () =>
        set({
          provinceLoading: { ...get().provinceLoading, [slug]: true },
          provinceError: { ...get().provinceError, [slug]: null },
        }),
      (data) =>
        set({
          provinces: { ...get().provinces, [slug]: data },
          provinceLoading: { ...get().provinceLoading, [slug]: false },
          provinceError: { ...get().provinceError, [slug]: null },
        }),
      (error) =>
        // Stale data, if any, is already in `provinces[slug]` — leave it.
        set({
          provinceLoading: { ...get().provinceLoading, [slug]: false },
          provinceError: { ...get().provinceError, [slug]: error },
        })
    );
  },

  fetchNational: (bypassCache = false) =>
    runFetch(
      "national",
      get().national !== null,
      bypassCache,
      get,
      set,
      () => apiClient.getNational(),
      () => set({ nationalLoading: true, nationalError: null }),
      (data) =>
        set({ national: data, nationalLoading: false, nationalError: null }),
      (error) => set({ nationalLoading: false, nationalError: error })
    ),

  fetchHistoryFeed: (bypassCache = false) =>
    runFetch(
      "historyFeed",
      get().historyFeed !== null,
      bypassCache,
      get,
      set,
      async () => {
        const index = await apiClient.getHistoryIndex();
        const slugs = index.provinsi.map((p) => p.slug);
        const results = await apiClient.getAllHistory(slugs);
        const histories: Array<{
          slug: string;
          name: string;
          products: Record<string, import("@/types/api").HistoryPoint[]>;
        }> = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === "fulfilled") {
            histories.push({
              slug: result.value.province_slug,
              name: result.value.province,
              products: result.value.products,
            });
          }
        }
        return { feed: buildChangeFeed(histories), syncedAt: index.synced_at };
      },
      () => set({ historyFeedLoading: true, historyFeedError: null }),
      (data) =>
        set({
          historyFeed: data.feed,
          historyFeedSyncedAt: data.syncedAt,
          historyFeedLoading: false,
          historyFeedError: null,
        }),
      (error) => set({ historyFeedLoading: false, historyFeedError: error })
    ),

  retry: async (key: string) => {
    if ((get().retryCount[key] ?? 0) >= MAX_RETRY_COUNT) return;

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
      case "historyFeed":
        await get().fetchHistoryFeed(true);
        break;
    }
  },
}));
