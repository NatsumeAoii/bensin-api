import { useEffect, useMemo, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { apiClient, ApiError } from "@/api/client";
import type { HistoryResponse } from "@/types/api";
import { filterByRange } from "@/utils/history-range";
import { isTransientError } from "@/utils/api-error";
import { ChartCanvas } from "@/components/PriceHistoryChart.canvas";

interface PriceHistoryChartProps {
  slug: string;
}

type RangeKey = "1m" | "3m" | "1y" | "all";

const RANGES: Array<{ key: RangeKey; label: string; days: number | null }> = [
  { key: "1m", label: "1 Bulan", days: 30 },
  { key: "3m", label: "3 Bulan", days: 90 },
  { key: "1y", label: "1 Tahun", days: 365 },
  { key: "all", label: "Semua", days: null },
];

/**
 * Lazy-loaded price history chart for a single province.
 *
 * Fetches the change-based history endpoint on mount and slices it client-side
 * by range, so switching ranges costs no extra network requests. The SVG step
 * line itself is rendered by {@link ChartCanvas}.
 *
 * Handles all states: loading, error (with retry for transient failures only),
 * empty (no history yet), and populated. History accrues over time, so a
 * brand-new deployment legitimately shows a single point until prices revise —
 * the empty/sparse copy explains it.
 */
export function PriceHistoryChart({ slug }: PriceHistoryChartProps) {
  const [result, setResult] = useState<{
    key: string;
    data: HistoryResponse;
  } | null>(null);
  const [errorState, setErrorState] = useState<{
    key: string;
    error: ApiError;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("1y");
  const [reloadToken, setReloadToken] = useState(0);

  const requestKey = `${slug}:${reloadToken}`;

  useEffect(() => {
    let active = true;

    apiClient
      .getHistory(slug)
      .then((data) => {
        if (!active) return;
        setResult({ key: `${slug}:${reloadToken}`, data });
        const products = Object.keys(data.products);
        setSelectedProduct((prev) =>
          prev && products.includes(prev) ? prev : (products[0] ?? null)
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        // A 404 means history hasn't been generated for this province yet —
        // treat as empty rather than an error so the UI explains it gently.
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
                : new ApiError("Gagal memuat riwayat harga", "NETWORK_ERROR"),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [slug, reloadToken]);

  // Derived state — avoids synchronous setState in the effect body. We are
  // loading until either a result or an error arrives for the current request.
  const history = result?.key === requestKey ? result.data : null;
  const error = errorState?.key === requestKey ? errorState.error : null;
  const loading = history === null && error === null;

  const products = history ? Object.keys(history.products) : [];

  const series = useMemo(() => {
    if (!history || !selectedProduct) return [];
    const raw = history.products[selectedProduct] ?? [];
    const rangeDef = RANGES.find((r) => r.key === range);
    return filterByRange(raw, rangeDef?.days ?? null, new Date());
  }, [history, selectedProduct, range]);

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
            onClick={() => setReloadToken((t) => t + 1)}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            Coba lagi
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
          Riwayat harga belum tersedia
        </p>
        <p className="max-w-xs text-xs text-stone-500 dark:text-stone-400">
          Data riwayat mulai terkumpul sejak fitur ini aktif dan akan bertambah
          setiap kali harga berubah.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
          <TrendingUp
            size={16}
            className="text-orange-500"
            aria-hidden="true"
          />
          Riwayat Harga
        </h2>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Rentang waktu"
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
      </div>

      {products.length > 1 && (
        <div
          className="mt-3 flex flex-wrap gap-1"
          role="group"
          aria-label="Pilih produk"
        >
          {products.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedProduct(p)}
              aria-pressed={selectedProduct === p}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 " +
                (selectedProduct === p
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
        <ChartCanvas series={series} productName={selectedProduct ?? ""} />
      </div>
    </section>
  );
}
