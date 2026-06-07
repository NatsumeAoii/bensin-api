import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { apiClient, ApiError } from "@/api/client";
import type { HistoryPoint, HistoryResponse } from "@/types/api";
import { formatRupiah } from "@/utils/format";
import { filterByRange } from "@/utils/history-range";

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

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Lazy-loaded price history chart for a single province.
 *
 * Renders a dependency-free SVG step line per fuel product (prices are step
 * functions — they hold flat then jump on a revision). Data is fetched on mount
 * from the change-based history endpoint and sliced client-side by range, so
 * switching ranges costs no extra network requests.
 *
 * Handles all states: loading, error (with retry), empty (no history yet), and
 * populated. History accrues over time, so a brand-new deployment legitimately
 * shows a single point until prices revise — the empty/sparse copy explains it.
 */
export function PriceHistoryChart({ slug }: PriceHistoryChartProps) {
  const [result, setResult] = useState<{ key: string; data: HistoryResponse } | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; error: ApiError } | null>(null);
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
          prev && products.includes(prev) ? prev : products[0] ?? null
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
      <section aria-busy="true" className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <div className="h-5 w-40 rounded-md shimmer" />
        <div className="mt-4 h-[220px] w-full rounded-lg shimmer" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
        <AlertCircle size={24} className="text-amber-500" aria-hidden="true" />
        <p className="text-sm text-stone-600 dark:text-stone-400">{error.message}</p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          Coba lagi
        </button>
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
          <TrendingUp size={16} className="text-orange-500" aria-hidden="true" />
          Riwayat Harga
        </h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Rentang waktu">
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
        <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Pilih produk">
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

interface ChartCanvasProps {
  series: HistoryPoint[];
  productName: string;
}

/**
 * Renders the SVG step line for a single product's series. Kept separate so the
 * geometry math stays isolated from the data-fetching shell above.
 */
function ChartCanvas({ series, productName }: ChartCanvasProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (series.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
        Tidak ada perubahan harga pada rentang ini.
      </p>
    );
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const prices = series.map((p) => p.price_rupiah);
  const times = series.map((p) => new Date(p.date).getTime());
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Pad the price axis so a flat line isn't pinned to an edge.
  const priceSpan = maxPrice - minPrice || maxPrice * 0.1 || 1;
  const yMin = minPrice - priceSpan * 0.15;
  const yMax = maxPrice + priceSpan * 0.15;

  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const timeSpan = maxTime - minTime || 1;

  const xFor = (t: number) =>
    PADDING.left + (series.length === 1 ? innerWidth / 2 : ((t - minTime) / timeSpan) * innerWidth);
  const yFor = (price: number) =>
    PADDING.top + innerHeight - ((price - yMin) / (yMax - yMin)) * innerHeight;

  const coords = series.map((p, i) => ({
    x: xFor(times[i]),
    y: yFor(p.price_rupiah),
    point: p,
  }));

  // Step path: horizontal hold then vertical jump at each change.
  let stepPath = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    stepPath += ` H ${coords[i].x} V ${coords[i].y}`;
  }

  const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const animate = !prefersReducedMotion();
  const active = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Grafik riwayat harga ${productName}. ${series.length} titik perubahan, dari ${formatRupiah(minPrice)} hingga ${formatRupiah(maxPrice)}.`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Y grid + labels */}
        {[yMax, (yMax + yMin) / 2, yMin].map((val, i) => {
          const y = yFor(val);
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                className="stroke-stone-200 dark:stroke-stone-700"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-stone-400 text-[9px] dark:fill-stone-500"
              >
                {Math.round(val).toLocaleString("id-ID")}
              </text>
            </g>
          );
        })}

        {/* Step line */}
        <path
          d={stepPath}
          fill="none"
          className={animate ? "stroke-orange-500 animate-fade-in" : "stroke-orange-500"}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Point markers + hover hit areas */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hoverIndex === i ? 5 : 3}
              className="fill-orange-500"
            />
            <rect
              x={c.x - 12}
              y={PADDING.top}
              width={24}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              tabIndex={0}
              role="button"
              aria-label={`${dateFmt.format(new Date(c.point.date))}: ${formatRupiah(c.point.price_rupiah)}`}
              style={{ cursor: "pointer", outline: "none" }}
            />
          </g>
        ))}

        {/* X labels: first and last */}
        <text
          x={coords[0].x}
          y={CHART_HEIGHT - 8}
          textAnchor="start"
          className="fill-stone-400 text-[9px] dark:fill-stone-500"
        >
          {dateFmt.format(new Date(series[0].date))}
        </text>
        {series.length > 1 && (
          <text
            x={coords[coords.length - 1].x}
            y={CHART_HEIGHT - 8}
            textAnchor="end"
            className="fill-stone-400 text-[9px] dark:fill-stone-500"
          >
            {dateFmt.format(new Date(series[series.length - 1].date))}
          </text>
        )}

        {/* Hover tooltip */}
        {active && (
          <g aria-hidden="true">
            <line
              x1={active.x}
              y1={PADDING.top}
              x2={active.x}
              y2={PADDING.top + innerHeight}
              className="stroke-stone-300 dark:stroke-stone-600"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      {/* Accessible/visible readout of the hovered point */}
      <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
        {active
          ? `${dateFmt.format(new Date(active.point.date))} — ${formatRupiah(active.point.price_rupiah)}`
          : `Harga terkini: ${formatRupiah(series[series.length - 1].price_rupiah)}`}
      </p>
    </div>
  );
}
