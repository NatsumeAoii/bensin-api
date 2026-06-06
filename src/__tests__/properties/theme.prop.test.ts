import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Property 11: Theme Validation
 * Validates: Requirements 7.2, 7.3
 *
 * For any string value read from localStorage under the theme key, the theme
 * initialization logic SHALL apply the stored value as the active theme if and
 * only if the value is exactly "light" or "dark". For any other value (including
 * empty string, null, or arbitrary strings), the system SHALL discard it and
 * apply the theme matching the operating system color scheme preference.
 */
describe("Feature: fuel-price-dashboard, Property 11: Theme Validation", () => {
  const OS_PREFERENCE = "dark";

  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "light" });
    document.documentElement.classList.remove("dark");

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "light" });
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  const storedValueArb: fc.Arbitrary<string | null> = fc.oneof(
    fc.constant("light"),
    fc.constant("dark"),
    fc.constant(null),
    fc.string()
  );

  it("applies stored value as active theme if and only if the value is exactly 'light' or 'dark'", () => {
    fc.assert(
      fc.property(storedValueArb, (storedValue) => {
        // Reset state between iterations
        localStorage.clear();
        useThemeStore.setState({ theme: "light" });
        document.documentElement.classList.remove("dark");

        // Set localStorage to the generated value
        if (storedValue !== null) {
          localStorage.setItem("theme", storedValue);
        }

        // Call initTheme
        useThemeStore.getState().initTheme();

        const resultTheme = useThemeStore.getState().theme;

        if (storedValue === "light" || storedValue === "dark") {
          // Valid stored value: theme should match stored value
          expect(resultTheme).toBe(storedValue);
        } else {
          // Invalid or missing value: theme should match OS preference
          expect(resultTheme).toBe(OS_PREFERENCE);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("discards invalid stored values and falls back to OS preference", () => {
    const invalidValueArb: fc.Arbitrary<string> = fc
      .string()
      .filter((s) => s !== "light" && s !== "dark");

    fc.assert(
      fc.property(invalidValueArb, (invalidValue) => {
        // Reset state between iterations
        localStorage.clear();
        useThemeStore.setState({ theme: "light" });
        document.documentElement.classList.remove("dark");

        // Set an invalid value
        localStorage.setItem("theme", invalidValue);

        // Call initTheme
        useThemeStore.getState().initTheme();

        const resultTheme = useThemeStore.getState().theme;

        // Should always fall back to OS preference
        expect(resultTheme).toBe(OS_PREFERENCE);
      }),
      { numRuns: 100 }
    );
  });

  it("applies OS preference when localStorage key does not exist (null case)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Reset state
        localStorage.clear();
        useThemeStore.setState({ theme: "light" });
        document.documentElement.classList.remove("dark");

        // No theme key in localStorage
        useThemeStore.getState().initTheme();

        const resultTheme = useThemeStore.getState().theme;
        expect(resultTheme).toBe(OS_PREFERENCE);
      }),
      { numRuns: 100 }
    );
  });
});
