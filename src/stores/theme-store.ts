import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = "theme";

function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getOsPreference(): Theme {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  } catch {
    // matchMedia unavailable or throws — default to light
  }
  return "light";
}

function applyTheme(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Swallow localStorage write failures silently
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    persistTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next: Theme = state.theme === "light" ? "dark" : "light";
      applyTheme(next);
      persistTheme(next);
      return { theme: next };
    });
  },

  initTheme: () => {
    const stored = getStoredTheme();
    // Only persist when the user has previously made an explicit choice. When
    // falling back to the OS preference, do NOT write to localStorage —
    // otherwise the first visit "locks in" the current OS value and later OS
    // dark-mode changes would stop being honored.
    const theme = stored ?? getOsPreference();
    applyTheme(theme);
    if (stored !== null) {
      persistTheme(stored);
    }
    set({ theme });
  },
}));
