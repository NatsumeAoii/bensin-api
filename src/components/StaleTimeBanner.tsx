import { Clock } from "lucide-react";
import { formatSyncTime } from "@/utils/date";
import { WarningBanner } from "@/components/WarningBanner";

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
export function StaleTimeBanner({
  syncedAt,
  now = new Date(),
}: StaleTimeBannerProps) {
  const syncedDate = new Date(syncedAt);
  const diffMs = now.getTime() - syncedDate.getTime();

  // Hide for fresh data or unparseable timestamps
  if (Number.isNaN(diffMs) || diffMs < STALE_THRESHOLD_MS) return null;

  return (
    <WarningBanner
      icon={Clock}
      message={`Data terakhir diperbarui ${formatSyncTime(syncedAt, now)}`}
    />
  );
}
