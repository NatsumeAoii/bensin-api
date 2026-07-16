import { Link } from "react-router";
import type { ProvinceResponse } from "@/types/api";
import { formatPrice } from "@/utils/format";
import { useTranslation } from "@/i18n";

interface RegionGroupProps {
  name: string;
  provinces: ProvinceResponse[];
  product: string;
  lowestPrice: number | null;
  highestPrice: number | null;
}

export function RegionGroup({
  name,
  provinces,
  product,
  lowestPrice,
  highestPrice,
}: RegionGroupProps) {
  const { t } = useTranslation();

  const prices: number[] = [];
  for (const p of provinces) {
    const found = p.products.find((pr) => pr.product === product);
    if (found?.price_rupiah != null) {
      prices.push(found.price_rupiah);
    }
  }
  const avg =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null;

  return (
    <details open className="group">
      <summary className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800/50">
        <span className="flex-1">{name}</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          {provinces.length}
        </span>
        {avg !== null && (
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            {t("national.averagePrice", {
              price: formatPrice(avg, t("price.unavailableLabel")),
            })}
          </span>
        )}
      </summary>
      <ul className="ml-2 divide-y divide-stone-100 border-l border-stone-200/60 dark:divide-stone-800 dark:border-stone-700/60">
        {provinces.map((province) => {
          const found = province.products.find((pr) => pr.product === product);
          const price = found?.price_rupiah ?? null;
          const isLowest = price === lowestPrice && price !== null;
          const isHighest = price === highestPrice && price !== null;

          return (
            <li key={province.province_slug}>
              <Link
                to={`/provinsi/${province.province_slug}`}
                className="touch-active flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {province.province}
                </span>
                <span className="flex items-center gap-2">
                  {isLowest && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {t("national.cheapest")}
                    </span>
                  )}
                  {isHighest && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-950/50 dark:text-red-300">
                      {t("national.mostExpensive")}
                    </span>
                  )}
                  <span
                    className={`text-sm font-bold ${
                      price === null
                        ? "text-stone-400 dark:text-stone-600"
                        : isLowest
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isHighest
                            ? "text-red-600 dark:text-red-400"
                            : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {formatPrice(price, t("price.unavailableLabel"))}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
