import { ExternalLink, Fuel } from "lucide-react";
import { useTranslation } from "@/i18n";

/**
 * App footer — shows data attribution, GitHub link, and brand identity.
 */
export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-stone-200/60 dark:border-stone-800/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + attribution */}
          <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Fuel size={14} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-stone-900 dark:text-white">
                BBM<span className="text-gradient">.id</span>
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              {t("footer.description")}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <a
              href="https://github.com/nasgunawann/bensin-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-700"
            >
              <ExternalLink size={14} aria-hidden="true" />
              {t("footer.viewGithub")}
            </a>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {t("footer.dataSource")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
