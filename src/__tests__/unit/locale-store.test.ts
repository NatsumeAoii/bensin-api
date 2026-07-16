import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLocaleStore } from "@/stores/locale-store";

describe("Locale Store", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "id" });
    localStorage.clear();
  });

  describe("initLocale", () => {
    it("defaults to 'id' when localStorage is empty and navigator is not English", () => {
      Object.defineProperty(navigator, "language", {
        value: "id-ID",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("id");
    });

    it("detects English from navigator.language", () => {
      Object.defineProperty(navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("en");
    });

    it("restores stored locale from localStorage", () => {
      localStorage.setItem("bbm-locale", "en");

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("en");
    });

    it("prefers stored locale over navigator detection", () => {
      localStorage.setItem("bbm-locale", "id");
      Object.defineProperty(navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("id");
    });

    it("falls back to 'id' for invalid stored value", () => {
      localStorage.setItem("bbm-locale", "fr");
      Object.defineProperty(navigator, "language", {
        value: "id-ID",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("id");
    });

    it("persists stored value back to localStorage on init", () => {
      localStorage.setItem("bbm-locale", "en");

      useLocaleStore.getState().initLocale();

      expect(localStorage.getItem("bbm-locale")).toBe("en");
    });

    it("does not persist when falling back to navigator detection", () => {
      Object.defineProperty(navigator, "language", {
        value: "id-ID",
        configurable: true,
      });
      useLocaleStore.getState().initLocale();

      expect(localStorage.getItem("bbm-locale")).toBeNull();
    });
  });

  describe("setLocale", () => {
    it("sets locale and persists to localStorage", () => {
      useLocaleStore.getState().setLocale("en");

      expect(useLocaleStore.getState().locale).toBe("en");
      expect(localStorage.getItem("bbm-locale")).toBe("en");
    });

    it("toggles from id to en", () => {
      useLocaleStore.setState({ locale: "id" });

      useLocaleStore.getState().setLocale("en");

      expect(useLocaleStore.getState().locale).toBe("en");
    });

    it("toggles from en to id", () => {
      useLocaleStore.setState({ locale: "en" });

      useLocaleStore.getState().setLocale("id");

      expect(useLocaleStore.getState().locale).toBe("id");
    });

    it("swallows localStorage write failures silently", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      expect(() => useLocaleStore.getState().setLocale("en")).not.toThrow();
      expect(useLocaleStore.getState().locale).toBe("en");

      vi.mocked(Storage.prototype.setItem).mockRestore();
    });
  });

  describe("corrupted storage", () => {
    it("handles corrupted JSON-like values gracefully", () => {
      localStorage.setItem("bbm-locale", '{"broken": true}');
      Object.defineProperty(navigator, "language", {
        value: "id-ID",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("id");
    });

    it("handles empty string in localStorage", () => {
      localStorage.setItem("bbm-locale", "");
      Object.defineProperty(navigator, "language", {
        value: "id-ID",
        configurable: true,
      });

      useLocaleStore.getState().initLocale();

      expect(useLocaleStore.getState().locale).toBe("id");
    });
  });
});
