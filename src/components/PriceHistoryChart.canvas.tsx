import { useMemo, useRef, useState } from "react";
import type { HistoryPoint } from "@/types/api";
import { formatRupiah } from "@/utils/format";

export const CHART_WIDTH = 600;
export const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

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

interface SeriesInput {
  name: string;
  color: { from: string; to: string };
  points: HistoryPoint[];
}

interface ChartCanvasProps {
  series: SeriesInput[];
  productName: string;
  labels?: {
    noChanges?: string;
    ariaLabel?: string;
    latestPrice?: string;
  };
}

export function ChartCanvas({ series, productName, labels }: ChartCanvasProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geometry = useMemo(() => {
    const flatPoints = series.flatMap((s) => s.points);
    if (flatPoints.length === 0) return null;

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    let minPrice = flatPoints[0].price_rupiah;
    let maxPrice = flatPoints[0].price_rupiah;
    for (const p of flatPoints) {
      if (p.price_rupiah < minPrice) minPrice = p.price_rupiah;
      if (p.price_rupiah > maxPrice) maxPrice = p.price_rupiah;
    }

    const allDates = [...new Set(flatPoints.map((p) => p.date))].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const times = allDates.map((d) => new Date(d).getTime());

    const priceSpan = maxPrice - minPrice || maxPrice * 0.1 || 1;
    const yMin = minPrice - priceSpan * 0.15;
    const yMax = maxPrice + priceSpan * 0.15;

    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const timeSpan = maxTime - minTime || 1;

    const xFor = (t: number) =>
      PADDING.left +
      (times.length === 1
        ? innerWidth / 2
        : ((t - minTime) / timeSpan) * innerWidth);
    const yFor = (price: number) =>
      PADDING.top +
      innerHeight -
      ((price - yMin) / (yMax - yMin)) * innerHeight;

    const seriesData = series.map((s) => {
      const sTimes = s.points.map((p) => new Date(p.date).getTime());
      const coords = s.points.map((p, i) => ({
        x: xFor(sTimes[i]),
        y: yFor(p.price_rupiah),
        point: p,
      }));

      let stepPath = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        stepPath += ` H ${coords[i].x} V ${coords[i].y}`;
      }

      return {
        name: s.name,
        color: s.color,
        coords,
        stepPath,
        points: s.points,
      };
    });

    const dateCoords = allDates.map((d) => ({
      date: d,
      x: xFor(new Date(d).getTime()),
    }));

    return {
      innerHeight,
      minPrice,
      maxPrice,
      yMin,
      yMax,
      yFor,
      seriesData,
      allDates,
      dateCoords,
    };
  }, [series]);

  if (geometry === null) {
    return (
      <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
        {labels?.noChanges ?? "Tidak ada perubahan harga pada rentang ini."}
      </p>
    );
  }

  const {
    innerHeight,
    minPrice,
    maxPrice,
    yMin,
    yMax,
    yFor,
    seriesData,
    allDates,
    dateCoords,
  } = geometry;

  const dateFmt = CHART_DATE_FORMAT;
  const animate = !prefersReducedMotion();

  const activeDateIdx = hoverIndex !== null ? hoverIndex : null;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          labels?.ariaLabel ??
          `Grafik riwayat harga ${productName}. ${allDates.length} titik perubahan, dari ${formatRupiah(minPrice)} hingga ${formatRupiah(maxPrice)}.`
        }
        onMouseLeave={() => setHoverIndex(null)}
      >
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

        {seriesData.map((sd) => (
          <path
            key={sd.name}
            d={sd.stepPath}
            fill="none"
            style={{ stroke: sd.color.from }}
            className={animate ? "animate-fade-in" : undefined}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {dateCoords.map((dc, i) => {
          const isFocused = focusIndex === i;
          return (
            <g key={dc.date}>
              {isFocused && (
                <line
                  x1={dc.x}
                  y1={PADDING.top}
                  x2={dc.x}
                  y2={PADDING.top + innerHeight}
                  fill="none"
                  className="stroke-orange-500"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
              <rect
                x={dc.x - 12}
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
                aria-label={seriesData
                  .map((sd) => {
                    const pt = sd.points.find((p) => p.date === dc.date);
                    return pt
                      ? `${sd.name}: ${formatRupiah(pt.price_rupiah)}`
                      : null;
                  })
                  .filter(Boolean)
                  .join(", ")}
                style={{ cursor: "pointer", outline: "none" }}
              />
            </g>
          );
        })}

        <text
          x={dateCoords[0].x}
          y={CHART_HEIGHT - 8}
          textAnchor="start"
          className="fill-stone-400 text-[9px] dark:fill-stone-500"
        >
          {dateFmt.format(new Date(allDates[0]))}
        </text>
        {allDates.length > 1 && (
          <text
            x={dateCoords[dateCoords.length - 1].x}
            y={CHART_HEIGHT - 8}
            textAnchor="end"
            className="fill-stone-400 text-[9px] dark:fill-stone-500"
          >
            {dateFmt.format(new Date(allDates[allDates.length - 1]))}
          </text>
        )}

        {activeDateIdx !== null && (
          <g aria-hidden="true">
            <line
              x1={dateCoords[activeDateIdx].x}
              y1={PADDING.top}
              x2={dateCoords[activeDateIdx].x}
              y2={PADDING.top + innerHeight}
              className="stroke-stone-300 dark:stroke-stone-600"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      <div
        className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400"
        aria-live="polite"
      >
        {activeDateIdx !== null ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
            <span>{dateFmt.format(new Date(allDates[activeDateIdx]))}</span>
            {seriesData.map((sd) => {
              const pt = sd.points.find(
                (p) => p.date === allDates[activeDateIdx]
              );
              if (!pt) return null;
              return (
                <span key={sd.name} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: sd.color.from }}
                  />
                  {sd.name}: {formatRupiah(pt.price_rupiah)}
                </span>
              );
            })}
          </div>
        ) : (
          labels?.latestPrice ??
          `Harga terkini: ${formatRupiah(seriesData[0]?.points[seriesData[0].points.length - 1]?.price_rupiah ?? 0)}`
        )}
      </div>
    </div>
  );
}
