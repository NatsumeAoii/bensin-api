import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, AlertCircle, Download } from "lucide-react";
import { apiClient, ApiError } from "@/api/client";
import type { HistoryResponse } from "@/types/api";
import { filterByRange } from "@/utils/history-range";
import { isTransientError } from "@/utils/api-error";
import { formatRupiah } from "@/utils/format";
import { getProductColor } from "@/utils/products";
import { computeHistoryStats } from "@/utils/history-stats";
import { exportToCsv } from "@/utils/csv-export";
import { ChartCanvas } from "@/components/PriceHistoryChart.canvas";
import { HistoryDataTable } from "@/components/HistoryDataTable";
import { useTranslation } from "@/i18n";

interface PriceHistoryChartProps {
  slug: string;
}

type RangeKey = "1m" | "3m" | "1y" | "all";

const MAX_SELECTED = 3;

export function PriceHistoryChart({ slug }: PriceHistoryChartProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<{
    key: string;
    data: HistoryResponse;
  } | null>(null);
  const [errorState, setErrorState] = useState<{
    key: string;
    error: ApiError;
  } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [range, setRange] = useState<RangeKey>("1y");
  const [reloadToken, setReloadToken] = useState(0);

  const requestKey = `${slug}:${reloadToken}`;

  const RANGES: Array<{ key: RangeKey; label: string; days: number | null }> =
    useMemo(
      () => [
        { key: "1m", label: t("history.1month"), days: 30 },
        { key: "3m", label: t("history.3months"), days: 90 },
        { key: "1y", label: t("history.1year"), days: 365 },
        { key: "all", label: t("history.all"), days: null },
      ],
      [t]
    );

  useEffect(() => {
    let active = true;

    apiClient
      .getHistory(slug)
      .then((data) => {
        if (!active) return;
        setResult({ key: `${slug}:${reloadToken}`, data });
        const products = Object.keys(data.products);
        setSelectedProducts((prev) => {
          const valid = prev.filter((p) => products.includes(p));
          if (valid.length === 0 && products.length > 0) return [products[0]];
          return valid;
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setResult({
            key: `${slug}:${reloadToken}`,
            data: { province: "", province_slug: slug, products: {} },
          });
        } else {
          setErrorState({
            key: `${slug}:${reloadToken}`,
            error:
              err instanceof ApiError
                ? err
                : new ApiError(t("error.loadHistory"), "NETWORK_ERROR"),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [slug, reloadToken, t]);

  const history = result?.key === requestKey ? result.data : null;
  const error = errorState?.key === requestKey ? errorState.error : null;
  const loading = history === null && error === null;

  const products = history ? Object.keys(history.products) : [];

  const toggleProduct = useCallback((product: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        return prev.filter((p) => p !== product);
      }
      if (prev.length >= MAX_SELECTED) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  }, []);

  const rangeDef = RANGES.find((r) => r.key === range);

  const multiSeries = useMemo(() => {
    if (!history) return [];
    return selectedProducts
      .map((name) => {
        const raw = history.products[name] ?? [];
        const points = filterByRange(raw, rangeDef?.days ?? null, new Date());
        return { name, color: getProductColor(name), points };
      })
      .filter((s) => s.points.length > 0);
  }, [history, selectedProducts, rangeDef]);

  const firstSeries = useMemo(
    () => multiSeries[0]?.points ?? [],
    [multiSeries]
  );
  const stats = useMemo(() => computeHistoryStats(firstSeries), [firstSeries]);

  const handleExport = useCallback(() => {
    if (!history || selectedProducts.length === 0) return;
    for (const productName of selectedProducts) {
      const raw = history.products[productName] ?? [];
      const points = filterByRange(raw, rangeDef?.days ?? null, new Date());
      const slugifiedProduct = productName.toLowerCase().replace(/\s+/g, "-");
      const filename = `riwayat-${slug}-${slugifiedProduct}-${range}.csv`;
      const headers = [
        t("history.date"),
        t("history.price"),
        t("history.price"),
      ];
      const rows: (string | number)[][] = points.map((p) => [
        p.date,
        p.price_rupiah,
        formatRupiah(p.price_rupiah),
      ]);
      exportToCsv(filename, headers, rows);
    }
  }, [history, selectedProducts, rangeDef, slug, range, t]);

  if (loading) {
    return (
      <section
        aria-busy="true"
        className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="h-5 w-40 rounded-md shimmer" />
        <div className="mt-4 h-[220px] w-full rounded-lg shimmer" />
      </section>
    );
  }

  if (error) {
    const canRetry = isTransientError(error);
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
        <AlertCircle size={24} className="text-amber-500" aria-hidden="true" />
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {error.message}
        </p>
        {canRetry && (
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {t("error.retry")}
          </button>
        )}
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center dark:border-stone-700 dark:bg-stone-900/50">
        <TrendingUp size={24} className="text-stone-400" aria-hidden="true" />
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t("history.notAvailable")}
        </p>
        <p className="max-w-xs text-xs text-stone-500 dark:text-stone-400">
          {t("history.notAvailableDesc")}
        </p>
      </section>
    );
  }

  const dataPointCount = firstSeries.length;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
          <TrendingUp
            size={16}
            className="text-orange-500"
            aria-hidden="true"
          />
          {t("history.title")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            aria-label={t("history.export")}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <Download size={14} aria-hidden="true" />
            {t("history.export")}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={t("history.timeRange")}
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 " +
                (range === r.key
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {dataPointCount === 1
            ? t("history.singlePoint")
            : t("history.dataPoints", { count: dataPointCount })}
        </span>
      </div>

      {products.length > 1 && (
        <div
          className="mt-3 flex flex-wrap gap-1"
          role="group"
          aria-label={t("history.selectProduct")}
        >
          {products.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProduct(p)}
              aria-pressed={selectedProducts.includes(p)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 " +
                (selectedProducts.includes(p)
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700")
              }
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ChartCanvas
          series={multiSeries}
          productName={selectedProducts.join(", ")}
          labels={{
            noChanges: t("chart.noChanges"),
            ariaLabel: t("chart.ariaLabel", {
              product: selectedProducts.join(", "),
              count: dataPointCount,
              min: formatRupiah(firstSeries[0]?.price_rupiah ?? 0),
              max: formatRupiah(
                firstSeries[firstSeries.length - 1]?.price_rupiah ?? 0
              ),
            }),
            latestPrice:
              dataPointCount > 0
                ? t("chart.latestPrice", {
                    price: formatRupiah(
                      firstSeries[firstSeries.length - 1].price_rupiah
                    ),
                  })
                : undefined,
          }}
        />
      </div>

      {stats && stats.pointCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs dark:bg-stone-800/50">
          <span className="text-stone-500 dark:text-stone-400">
            {t("history.startPrice")}:
          </span>
          <span className="font-medium text-stone-900 dark:text-stone-100">
            {formatRupiah(stats.startPrice)}
          </span>
          <span className="text-stone-400">→</span>
          <span className="text-stone-500 dark:text-stone-400">
            {t("history.endPrice")}:
          </span>
          <span className="font-medium text-stone-900 dark:text-stone-100">
            {formatRupiah(stats.endPrice)}
          </span>
          <span
            className={
              "font-semibold " +
              (stats.changeAbsolute < 0
                ? "text-emerald-600 dark:text-emerald-400"
                : stats.changeAbsolute > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-stone-500")
            }
          >
            ({stats.changeAbsolute > 0 ? "+" : ""}
            {stats.changePercent.toFixed(1)}%)
          </span>
        </div>
      )}

      {selectedProducts.length > 0 && history && (
        <HistoryDataTable
          series={firstSeries}
          productName={selectedProducts[0]}
          provinceName={history.province}
        />
      )}
    </section>
  );
}
