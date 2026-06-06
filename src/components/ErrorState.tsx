import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

/**
 * Displays an error message paired with a retry button.
 * Uses aria-live="assertive" to announce errors to screen readers immediately.
 */
export function ErrorState({ message, onRetry, disabled = false }: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-red-200 bg-red-50/50 p-10 text-center dark:border-red-900/40 dark:bg-red-950/20"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
        <AlertTriangle
          className="h-8 w-8 text-red-500 dark:text-red-400"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-stone-800 dark:text-stone-200">
          Terjadi Kesalahan
        </p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <RefreshCw size={16} aria-hidden="true" />
        {disabled ? "Coba lagi nanti" : "Coba Lagi"}
      </button>
    </div>
  );
}
