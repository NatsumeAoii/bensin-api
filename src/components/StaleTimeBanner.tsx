import { Clock } from "lucide-react";
import { formatSyncTime } from "@/utils/date";

interface StaleTimeBannerProps {
  /** Pipeline sync timestamp (ISO 8601) — when our data was last fetched. */
  syncedAt: string;
  /** Current time, injectable for testing. Defaults to now. */
  now?: Date;
}

/**
 * The sync pipeline runs every 6 hours. We only warn once the data is clearly
 * behind schedule — older than two full sync cycles plus a buffer — so a single
 * missed run does not trigger a false alarm.
 */
const SYNC_INTERVAL_HOURS = 6;
const STALE_THRESHOLD_MS = (SYNC_INTERVAL_HOURS * 2 + 1) * 60 * 60 * 1000;

/**
 * Displays a warning banner when the pipeline sync is overdue.
 *
 * Tracks `synced_at` (when our pipeline last fetched upstream), NOT
 * `pertamina_updated_at` (when Pertamina last changed prices). Prices change
 * infrequently, so keying off the price-change date would warn constantly even
 * when the data is freshly synced.
 *
 * Reuses the shared `formatSyncTime` utility so the relative-time wording stays
 * consistent with the rest of the app.
 *
 * Distinct from StaleDataBanner, which shows on error-with-stale-data.
 */
export function StaleTimeBanner({ syncedAt, now = new Date() }: StaleTimeBannerProps) {
  const syncedDate = new Date(syncedAt);
  const diffMs = now.getTime() - syncedDate.getTime();

  // Hide for fresh data or unparseable timestamps
  if (Number.isNaN(diffMs) || diffMs < STALE_THRESHOLD_MS) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
        <Clock size={16} aria-hidden="true" className="text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Data terakhir diperbarui {formatSyncTime(syncedAt, now)}
      </p>
    </div>
  );
}
