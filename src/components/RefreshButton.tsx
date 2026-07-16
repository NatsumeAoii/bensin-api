import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n";

interface RefreshButtonProps {
  onRefresh: () => void;
  loading: boolean;
}

/**
 * Manual refresh button — allows users to force a data re-fetch.
 * Shows a spinning animation while loading.
 */
export function RefreshButton({ onRefresh, loading }: RefreshButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      aria-label={t("refresh.label")}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
    >
      <RefreshCw
        size={16}
        aria-hidden="true"
        className={loading ? "animate-spin" : ""}
      />
    </button>
  );
}
