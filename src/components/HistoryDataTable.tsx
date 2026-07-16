import { useState } from "react";
import { Table2, ChevronDown, ChevronUp } from "lucide-react";
import type { HistoryPoint } from "@/types/api";
import { formatRupiah } from "@/utils/format";
import { useTranslation } from "@/i18n";

interface HistoryDataTableProps {
  series: HistoryPoint[];
  productName: string;
  provinceName: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function HistoryDataTable({
  series,
  productName,
  provinceName,
}: HistoryDataTableProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800"
      >
        <Table2 size={14} aria-hidden="true" />
        {open ? t("history.hideTable") : t("history.showTable")}
        {open ? (
          <ChevronUp size={14} aria-hidden="true" />
        ) : (
          <ChevronDown size={14} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              {productName} — {provinceName}
            </caption>
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="pb-2 pr-4 font-semibold text-stone-700 dark:text-stone-300">
                  {t("history.date")}
                </th>
                <th className="pb-2 pr-4 font-semibold text-stone-700 dark:text-stone-300">
                  {t("history.price")}
                </th>
                <th className="pb-2 font-semibold text-stone-700 dark:text-stone-300">
                  {t("history.change")}
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((p, i) => {
                const prev = i > 0 ? series[i - 1] : null;
                const delta = prev ? p.price_rupiah - prev.price_rupiah : 0;
                return (
                  <tr
                    key={p.date}
                    className="border-b border-stone-100 dark:border-stone-800"
                  >
                    <td className="py-2 pr-4 text-stone-600 dark:text-stone-400">
                      {DATE_FORMAT.format(new Date(p.date))}
                    </td>
                    <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                      {formatRupiah(p.price_rupiah)}
                    </td>
                    <td
                      className={
                        "py-2 font-medium " +
                        (delta > 0
                          ? "text-red-600 dark:text-red-400"
                          : delta < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-stone-400")
                      }
                    >
                      {i === 0
                        ? "—"
                        : (delta > 0 ? "+" : "") + formatRupiah(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
