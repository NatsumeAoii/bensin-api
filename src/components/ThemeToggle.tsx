import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useTranslation } from "@/i18n";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { t } = useTranslation();

  const isLight = theme === "light";
  const ariaLabel = isLight ? t("theme.switchToDark") : t("theme.switchToLight");
  const Icon = isLight ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-orange-400"
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
