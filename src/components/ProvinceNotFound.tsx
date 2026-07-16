import { Link } from "react-router";
import { MapPin, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n";

/**
 * Shared "province not found" panel used for both an invalid slug and a 404
 * response. Kept in one place so both paths stay visually and behaviorally
 * identical.
 */
export function ProvinceNotFound() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
          <MapPin
            className="h-8 w-8 text-stone-400 dark:text-stone-500"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t("notFound.provinceTitle")}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t("notFound.provinceDesc")}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t("notFound.backToList")}
        </Link>
      </div>
    </div>
  );
}
