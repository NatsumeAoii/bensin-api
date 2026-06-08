import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useThemeStore } from "@/stores/theme-store";

describe("Theme Store", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({ theme: "light" });
    // Clear localStorage
    localStorage.clear();
    // Reset document class list
    document.documentElement.classList.remove("dark");
    // Provide a default matchMedia that returns light preference
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  describe("initTheme", () => {
    it("applies stored 'dark' theme from localStorage", () => {
      localStorage.setItem("theme", "dark");

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("applies stored 'light' theme from localStorage", () => {
      localStorage.setItem("theme", "light");

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("falls back to OS preference when localStorage has invalid value", () => {
      localStorage.setItem("theme", "invalid-value");
      // jsdom default: matchMedia returns false for prefers-color-scheme: dark
      // so OS preference is "light"

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("falls back to OS preference when localStorage is empty", () => {
      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("light");
    });

    it("falls back to OS dark preference when matchMedia matches dark", () => {
      // Mock matchMedia to report dark preference
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("discards non-string values and falls back to OS preference", () => {
      // localStorage.getItem returns null for missing keys
      // This simulates localStorage returning null
      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe("light");
    });

    it("does not persist when falling back to OS preference", () => {
      // No stored value — init resolves via OS preference and must NOT write,
      // so later OS dark-mode changes keep being honored on subsequent visits.
      useThemeStore.getState().initTheme();

      expect(localStorage.getItem("theme")).toBeNull();
    });

    it("persists the stored value when one already exists", () => {
      localStorage.setItem("theme", "dark");

      useThemeStore.getState().initTheme();

      expect(localStorage.getItem("theme")).toBe("dark");
    });
  });

  describe("setTheme", () => {
    it("sets dark theme and applies dark class", () => {
      useThemeStore.getState().setTheme("dark");

      expect(useThemeStore.getState().theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("sets light theme and removes dark class", () => {
      document.documentElement.classList.add("dark");

      useThemeStore.getState().setTheme("light");

      expect(useThemeStore.getState().theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorage.getItem("theme")).toBe("light");
    });

    it("swallows localStorage write failures silently", () => {
      // Mock localStorage.setItem to throw
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      // Should not throw
      expect(() => useThemeStore.getState().setTheme("dark")).not.toThrow();
      expect(useThemeStore.getState().theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      vi.mocked(Storage.prototype.setItem).mockRestore();
    });
  });

  describe("toggleTheme", () => {
    it("toggles from light to dark", () => {
      useThemeStore.setState({ theme: "light" });

      useThemeStore.getState().toggleTheme();

      expect(useThemeStore.getState().theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles from dark to light", () => {
      useThemeStore.setState({ theme: "dark" });
      document.documentElement.classList.add("dark");

      useThemeStore.getState().toggleTheme();

      expect(useThemeStore.getState().theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("persists toggled theme to localStorage", () => {
      useThemeStore.setState({ theme: "light" });

      useThemeStore.getState().toggleTheme();

      expect(localStorage.getItem("theme")).toBe("dark");
    });
  });
});
