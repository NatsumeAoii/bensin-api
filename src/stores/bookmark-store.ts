import { create } from "zustand";

const STORAGE_KEY = "bbm-bookmarks";
const MAX_BOOKMARKS = 20;

interface BookmarkState {
  bookmarks: string[];
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  clearAll: () => void;
  mergeBookmarks: (slugs: string[]) => void;
}

function loadBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

function persistBookmarks(bookmarks: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // swallow
  }
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: loadBookmarks(),

  toggleBookmark: (slug: string) => {
    const { bookmarks } = get();
    const idx = bookmarks.indexOf(slug);
    if (idx >= 0) {
      const next = bookmarks.filter((s) => s !== slug);
      persistBookmarks(next);
      set({ bookmarks: next });
    } else if (bookmarks.length < MAX_BOOKMARKS) {
      const next = [...bookmarks, slug];
      persistBookmarks(next);
      set({ bookmarks: next });
    }
  },

  isBookmarked: (slug: string) => get().bookmarks.includes(slug),

  clearAll: () => {
    persistBookmarks([]);
    set({ bookmarks: [] });
  },

  mergeBookmarks: (slugs: string[]) => {
    const { bookmarks } = get();
    const merged = new Set(bookmarks);
    for (const slug of slugs) {
      if (merged.size >= MAX_BOOKMARKS) break;
      merged.add(slug);
    }
    const next = [...merged];
    persistBookmarks(next);
    set({ bookmarks: next });
  },
}));
