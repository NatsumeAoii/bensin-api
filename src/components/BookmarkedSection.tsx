import { useState } from "react";
import { Link } from "react-router";
import { Bookmark, ChevronRight, Trash2, X } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { useTranslation } from "@/i18n";

interface BookmarkedSectionProps {
  /** Map of slug → province name for display */
  provinceNames: Record<string, string>;
}

export function BookmarkedSection({ provinceNames }: BookmarkedSectionProps) {
  const { t } = useTranslation();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const clearAll = useBookmarkStore((s) => s.clearAll);
  const [confirming, setConfirming] = useState(false);

  if (bookmarks.length === 0) return null;

  function handleClearAll() {
    if (confirming) {
      clearAll();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  return (
    <section className="mb-5" aria-label={t("bookmark.section")}>
      <div className="flex items-center gap-2 mb-3">
        <Bookmark size={16} className="text-orange-500" aria-hidden="true" />
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200">
          {t("bookmark.section")}
        </h2>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          {t("bookmark.count", { count: bookmarks.length })}
        </span>
        <div className="flex-1" />
        {confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {t("bookmark.clearConfirm")}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {t("bookmark.clearAll")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800"
              aria-label="Cancel"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-stone-500 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:text-red-400"
          >
            <Trash2 size={12} aria-hidden="true" />
            {t("bookmark.clearAll")}
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {bookmarks.map((slug) => {
          const name = provinceNames[slug] ?? slug;
          return (
            <Link
              key={slug}
              to={`/provinsi/${slug}`}
              className="touch-active flex shrink-0 items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700/60 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-800/50 dark:hover:bg-orange-950/20 dark:hover:text-orange-400"
            >
              <span className="whitespace-nowrap">{name}</span>
              <ChevronRight
                size={14}
                className="text-stone-400 dark:text-stone-500"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
