import { useEffect, useRef } from "react";

const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Auto-refreshes data when the browser tab regains visibility and the data
 * has exceeded a staleness threshold. Internally tracks the last fetch
 * timestamp via a ref that resets whenever `refreshFn` changes or the hook
 * triggers a refresh on tab focus.
 *
 * @param refreshFn - A **stable** function reference that fetches fresh data.
 *   Must be wrapped in `useCallback` or defined outside the component.
 *
 *   **Why stability matters:** `refreshFn` is a dependency of an internal
 *   `useEffect` (`[refreshFn]`). If a new function reference is created on
 *   every render (e.g., an inline arrow function), the effect fires each
 *   render and resets `lastFetchRef` to `Date.now()`. This makes the elapsed
 *   time appear zero on every visibility change, preventing staleness
 *   detection from ever triggering a refresh.
 *
 * @param staleAfterMs - The duration in milliseconds after which data is
 *   considered stale. When the tab regains focus and more than `staleAfterMs`
 *   has elapsed since the last fetch, `refreshFn` is invoked.
 *   Defaults to `300_000` (5 minutes).
 *
 * @example
 * ```tsx
 * import { useCallback } from "react";
 * import { useVisibilityRefresh } from "../utils/use-visibility-refresh";
 *
 * function PriceList() {
 *   const fetchPrices = useCallback(() => {
 *     // fetch latest prices from API
 *   }, []);
 *
 *   useVisibilityRefresh(fetchPrices);
 *   // or with a custom threshold:
 *   // useVisibilityRefresh(fetchPrices, 60_000);
 *
 *   return <div>{"render prices"}</div>;
 * }
 * ```
 */
export function useVisibilityRefresh(
  refreshFn: () => void,
  staleAfterMs: number = DEFAULT_STALE_MS
): void {
  const lastFetchRef = useRef<number>(0);

  // Initialize on first render via effect
  useEffect(() => {
    lastFetchRef.current = Date.now();
  }, []);

  // Update last fetch time whenever refreshFn reference changes (i.e., new data fetched)
  useEffect(() => {
    lastFetchRef.current = Date.now();
  }, [refreshFn]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed >= staleAfterMs) {
        lastFetchRef.current = Date.now();
        refreshFn();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshFn, staleAfterMs]);
}
