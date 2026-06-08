import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface WarningBannerProps {
  icon: LucideIcon;
  message: ReactNode;
  /** Optional inline recovery action rendered to the right of the message. */
  action?: { label: string; onClick: () => void };
}

/**
 * Shared amber warning banner used for stale-data and stale-time notices.
 * Centralizes the markup and a11y attributes (`role="status"`, `aria-live`)
 * so both banner variants stay visually and behaviorally identical.
 */
export function WarningBanner({
  icon: Icon,
  message,
  action,
}: WarningBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
        <Icon
          size={16}
          aria-hidden="true"
          className="text-amber-600 dark:text-amber-400"
        />
      </div>
      <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-200">
        {message}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 rounded-lg border border-amber-300 bg-white/60 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
