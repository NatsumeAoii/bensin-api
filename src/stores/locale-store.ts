import { create } from "zustand";
import type { Locale } from "@/i18n/translations";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  initLocale: () => void;
}

const STORAGE_KEY = "bbm-locale";

function isValidLocale(value: unknown): value is Locale {
  return value === "id" || value === "en";
}

function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getOsLocale(): Locale {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.language.startsWith("en")
    ) {
      return "en";
    }
  } catch {
    // navigator unavailable
  }
  return "id";
}

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Swallow localStorage write failures silently
  }
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "id",

  setLocale: (locale: Locale) => {
    persistLocale(locale);
    set({ locale });
  },

  initLocale: () => {
    const stored = getStoredLocale();
    const locale = stored ?? getOsLocale();
    if (stored !== null) {
      persistLocale(stored);
    }
    set({ locale });
  },
}));
