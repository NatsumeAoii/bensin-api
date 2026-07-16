import { Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { useTranslation } from "@/i18n";

interface BookmarkButtonProps {
  slug: string;
}

export function BookmarkButton({ slug }: BookmarkButtonProps) {
  const { t } = useTranslation();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const isBookmarked = bookmarks.includes(slug);

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(slug)}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? t("bookmark.remove") : t("bookmark.save")}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-orange-400"
    >
      {isBookmarked ? (
        <BookmarkCheck
          size={18}
          aria-hidden="true"
          className="text-orange-500"
        />
      ) : (
        <Bookmark size={18} aria-hidden="true" />
      )}
    </button>
  );
}
