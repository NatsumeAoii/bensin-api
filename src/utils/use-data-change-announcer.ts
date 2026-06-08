import { useEffect, useRef } from "react";

/**
 * Announces data updates to assistive technology via a polite `aria-live`
 * region without triggering React re-renders.
 *
 * Tracks a stable "fingerprint" of the current data. When the fingerprint
 * changes from a previously seen value (i.e. the data refreshed, not the first
 * load), the provided message is written directly to the supplied live-region
 * element. The first observed fingerprint is recorded silently so the initial
 * load does not announce.
 *
 * @param fingerprint  A string uniquely identifying the current data snapshot,
 *   or `null` when there is no data yet.
 * @param ref          Ref to the visually-hidden `aria-live` region element.
 * @param message      The text to announce when the fingerprint changes.
 */
export function useDataChangeAnnouncer(
  fingerprint: string | null,
  ref: React.RefObject<HTMLElement | null>,
  message: string
): void {
  const previousRef = useRef<string | null>(null);

  useEffect(() => {
    if (fingerprint === null) return;

    if (
      previousRef.current !== null &&
      previousRef.current !== fingerprint &&
      ref.current
    ) {
      ref.current.textContent = message;
    }
    previousRef.current = fingerprint;
  }, [fingerprint, message, ref]);
}
