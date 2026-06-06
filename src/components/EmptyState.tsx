import { SearchX } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  message: string;
  action?: EmptyStateAction;
}

/**
 * Displays an empty state with a branded icon, message, and optional action CTA.
 * Used when data is fetched successfully but contains no results.
 */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-10 text-center dark:border-stone-700 dark:bg-stone-900/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
        <SearchX
          className="h-8 w-8 text-stone-400 dark:text-stone-500"
          aria-hidden="true"
        />
      </div>
      <p className="max-w-sm text-base font-medium text-stone-600 dark:text-stone-400">
        {message}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="min-h-[44px] min-w-[44px] rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-600 dark:hover:bg-stone-700 dark:hover:text-orange-400"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
