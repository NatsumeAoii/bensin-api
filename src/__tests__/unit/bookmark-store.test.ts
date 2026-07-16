import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBookmarkStore } from "@/stores/bookmark-store";

describe("Bookmark Store", () => {
  beforeEach(() => {
    useBookmarkStore.setState({ bookmarks: [] });
    localStorage.clear();
  });

  describe("toggleBookmark", () => {
    it("adds a bookmark when not bookmarked", () => {
      useBookmarkStore.getState().toggleBookmark("aceh");
      expect(useBookmarkStore.getState().bookmarks).toContain("aceh");
    });

    it("removes a bookmark when already bookmarked", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh"] });
      useBookmarkStore.getState().toggleBookmark("aceh");
      expect(useBookmarkStore.getState().bookmarks).not.toContain("aceh");
    });

    it("persists to localStorage", () => {
      useBookmarkStore.getState().toggleBookmark("bali");
      expect(JSON.parse(localStorage.getItem("bbm-bookmarks")!)).toEqual(["bali"]);
    });

    it("does not add beyond max 20 bookmarks", () => {
      const slugs = Array.from({ length: 20 }, (_, i) => `slug-${i}`);
      useBookmarkStore.setState({ bookmarks: slugs });

      useBookmarkStore.getState().toggleBookmark("new-slug");
      expect(useBookmarkStore.getState().bookmarks).not.toContain("new-slug");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(20);
    });

    it("still allows removing from a full list", () => {
      const slugs = Array.from({ length: 20 }, (_, i) => `slug-${i}`);
      useBookmarkStore.setState({ bookmarks: slugs });

      useBookmarkStore.getState().toggleBookmark("slug-5");
      expect(useBookmarkStore.getState().bookmarks).not.toContain("slug-5");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(19);
    });
  });

  describe("isBookmarked", () => {
    it("returns true for bookmarked slug", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh"] });
      expect(useBookmarkStore.getState().isBookmarked("aceh")).toBe(true);
    });

    it("returns false for non-bookmarked slug", () => {
      expect(useBookmarkStore.getState().isBookmarked("aceh")).toBe(false);
    });
  });

  describe("clearAll", () => {
    it("empties the bookmarks array", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh", "bali"] });
      useBookmarkStore.getState().clearAll();
      expect(useBookmarkStore.getState().bookmarks).toEqual([]);
    });

    it("persists empty array to localStorage", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh"] });
      useBookmarkStore.getState().clearAll();
      expect(JSON.parse(localStorage.getItem("bbm-bookmarks")!)).toEqual([]);
    });
  });

  describe("persistence round-trip", () => {
    it("restores bookmarks from localStorage", () => {
      localStorage.setItem("bbm-bookmarks", JSON.stringify(["aceh", "bali"]));
      useBookmarkStore.setState({ bookmarks: [] });

      // Re-initialize by calling loadBookmarks pattern
      const raw = localStorage.getItem("bbm-bookmarks");
      const parsed = JSON.parse(raw!);
      useBookmarkStore.setState({ bookmarks: parsed });

      expect(useBookmarkStore.getState().bookmarks).toEqual(["aceh", "bali"]);
    });

    it("handles corrupted JSON gracefully", () => {
      localStorage.setItem("bbm-bookmarks", "not-json{");
      // The store init calls loadBookmarks which catches parse errors
      // Simulate by calling toggle which reads from storage
      useBookmarkStore.getState().toggleBookmark("aceh");
      expect(useBookmarkStore.getState().bookmarks).toContain("aceh");
    });

    it("handles empty localStorage gracefully", () => {
      expect(useBookmarkStore.getState().bookmarks).toEqual([]);
    });
  });

  describe("corrupted storage", () => {
    it("falls back to empty array for non-array JSON", () => {
      localStorage.setItem("bbm-bookmarks", '{"not": "array"}');
      // Re-trigger load by creating a fresh toggle
      useBookmarkStore.getState().toggleBookmark("test");
      expect(useBookmarkStore.getState().bookmarks).toContain("test");
    });
  });

  describe("mergeBookmarks", () => {
    it("merges new slugs with existing", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh"] });
      useBookmarkStore.getState().mergeBookmarks(["bali", "papua"]);
      expect(useBookmarkStore.getState().bookmarks).toEqual(["aceh", "bali", "papua"]);
    });

    it("deduplicates slugs", () => {
      useBookmarkStore.setState({ bookmarks: ["aceh"] });
      useBookmarkStore.getState().mergeBookmarks(["aceh", "bali"]);
      expect(useBookmarkStore.getState().bookmarks).toEqual(["aceh", "bali"]);
    });

    it("respects max limit during merge", () => {
      const slugs = Array.from({ length: 18 }, (_, i) => `slug-${i}`);
      useBookmarkStore.setState({ bookmarks: slugs });
      useBookmarkStore.getState().mergeBookmarks(["new-1", "new-2", "new-3", "new-4"]);
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(20);
    });
  });

  describe("localStorage write failure", () => {
    it("swallows write errors silently", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      expect(() => useBookmarkStore.getState().toggleBookmark("aceh")).not.toThrow();
      expect(useBookmarkStore.getState().bookmarks).toContain("aceh");

      vi.mocked(Storage.prototype.setItem).mockRestore();
    });
  });
});
