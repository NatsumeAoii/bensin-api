import { Languages } from "lucide-react";
import { useTranslation } from "@/i18n";

export function LocaleToggle() {
  const { locale, setLocale } = useTranslation();

  function handleToggle() {
    setLocale(locale === "id" ? "en" : "id");
  }

  const ariaLabel = locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={ariaLabel}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-orange-400"
    >
      <Languages size={18} aria-hidden="true" />
      <span className="text-xs font-bold uppercase">
        {locale === "id" ? "ID" : "EN"}
      </span>
    </button>
  );
}
