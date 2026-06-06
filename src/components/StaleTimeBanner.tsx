import { Clock } from "lucide-react";
import { formatSyncTime } from "@/utils/date";

interface StaleTimeBannerProps {
  updatedAt: string;
  /** Current time, injectable for testing. Defaults to now. */
  now?: Date;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Displays a warning banner when the data is older than 2 hours.
 * Reuses the shared `formatSyncTime` utility so the relative-time wording
 * stays consistent with the rest of the app.
 *
 * Distinct from StaleDataBanner, which shows on error-with-stale-data.
 */
export function StaleTimeBanner({ updatedAt, now = new Date() }: StaleTimeBannerProps) {
  const updatedDate = new Date(updatedAt);
  const diffMs = now.getTime() - updatedDate.getTime();

  // Hide for fresh data or unparseable timestamps
  if (Number.isNaN(diffMs) || diffMs < TWO_HOURS_MS) return null;

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
        Data terakhir diperbarui {formatSyncTime(updatedAt, now)}
      </p>
    </div>
  );
}
