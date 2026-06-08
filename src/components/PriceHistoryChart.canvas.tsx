import { useMemo, useRef, useState } from "react";
import type { HistoryPoint } from "@/types/api";
import { formatRupiah } from "@/utils/format";

export const CHART_WIDTH = 600;
export const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

/**
 * Cached Intl.DateTimeFormat — avoids re-initializing ICU locale data on every
 * render/hover. Safe to reuse since locale/options never change at runtime.
 */
const CHART_DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface ChartCanvasProps {
  series: HistoryPoint[];
  productName: string;
}

/**
 * Renders the SVG step line for a single product's series. Kept separate from
 * the data-fetching shell so the geometry math stays isolated and testable.
 */
export function ChartCanvas({ series, productName }: ChartCanvasProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Geometry is recomputed only when the series changes — not on every hover.
  const geometry = useMemo(() => {
    if (series.length === 0) return null;

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    // Single-pass min/max avoids spreading the whole array into Math.min/max
    // (which is slower and risks call-stack limits on long series).
    let minPrice = series[0].price_rupiah;
    let maxPrice = series[0].price_rupiah;
    for (const p of series) {
      if (p.price_rupiah < minPrice) minPrice = p.price_rupiah;
      if (p.price_rupiah > maxPrice) maxPrice = p.price_rupiah;
    }

    const times = series.map((p) => new Date(p.date).getTime());
    // Pad the price axis so a flat line isn't pinned to an edge.
    const priceSpan = maxPrice - minPrice || maxPrice * 0.1 || 1;
    const yMin = minPrice - priceSpan * 0.15;
    const yMax = maxPrice + priceSpan * 0.15;

    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const timeSpan = maxTime - minTime || 1;

    const xFor = (t: number) =>
      PADDING.left +
      (series.length === 1
        ? innerWidth / 2
        : ((t - minTime) / timeSpan) * innerWidth);
    const yFor = (price: number) =>
      PADDING.top +
      innerHeight -
      ((price - yMin) / (yMax - yMin)) * innerHeight;

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

    return {
      innerHeight,
      minPrice,
      maxPrice,
      yMin,
      yMax,
      coords,
      stepPath,
      yFor,
    };
  }, [series]);

  if (geometry === null) {
    return (
      <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
        Tidak ada perubahan harga pada rentang ini.
      </p>
    );
  }

  const {
    innerHeight,
    minPrice,
    maxPrice,
    yMin,
    yMax,
    coords,
    stepPath,
    yFor,
  } = geometry;

  const dateFmt = CHART_DATE_FORMAT;
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
          className={
            animate ? "stroke-orange-500 animate-fade-in" : "stroke-orange-500"
          }
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Point markers + hover/focus hit areas */}
        {coords.map((c, i) => (
          <g key={i}>
            {/* Visible focus ring — replaces the removed default outline so
                keyboard users can see which point is active (WCAG 2.4.7). */}
            {focusIndex === i && (
              <circle
                cx={c.x}
                cy={c.y}
                r={8}
                fill="none"
                className="stroke-orange-500"
                strokeWidth={2}
              />
            )}
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
              onFocus={() => {
                setHoverIndex(i);
                setFocusIndex(i);
              }}
              onBlur={() => setFocusIndex(null)}
              onClick={() => setHoverIndex(i)}
              onTouchStart={() => setHoverIndex(i)}
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
      <p
        className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400"
        aria-live="polite"
      >
        {active
          ? `${dateFmt.format(new Date(active.point.date))} — ${formatRupiah(active.point.price_rupiah)}`
          : `Harga terkini: ${formatRupiah(series[series.length - 1].price_rupiah)}`}
      </p>
    </div>
  );
}
