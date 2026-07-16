/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import {
  resolveTranslation,
  type Locale,
  type TranslationKey,
} from "./translations";

interface I18nContextValue {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const storeSetLocale = useLocaleStore((s) => s.setLocale);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      resolveTranslation(locale, key, params),
    [locale]
  );

  const setLocale = useCallback(
    (l: Locale) => storeSetLocale(l),
    [storeSetLocale]
  );

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}
