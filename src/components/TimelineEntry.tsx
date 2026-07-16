import { Link } from "react-router";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { PriceChangeEvent } from "@/types/api";
import { formatRupiah } from "@/utils/format";
import { getProductColor } from "@/utils/products";

interface TimelineEntryProps {
  event: PriceChangeEvent;
}

export function TimelineEntry({ event }: TimelineEntryProps) {
  const isDecrease = event.change_absolute < 0;
  const color = getProductColor(event.product);
  const absChange = Math.abs(event.change_absolute);
  const absPercent = Math.abs(event.change_percent);

  return (
    <Link
      to={`/provinsi/${event.province_slug}`}
      className="touch-active flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
        }}
        aria-hidden="true"
      >
        {event.product.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {event.province}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {event.product}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {formatRupiah(event.old_price)} → {formatRupiah(event.new_price)}
        </div>
      </div>
      <div
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isDecrease
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        {isDecrease ? (
          <TrendingDown size={12} aria-hidden="true" />
        ) : (
          <TrendingUp size={12} aria-hidden="true" />
        )}
        {isDecrease ? "▼" : "▲"} {formatRupiah(absChange)} ({absPercent}%)
      </div>
    </Link>
  );
}
