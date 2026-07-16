import type { HistoryPoint } from "@/types/api";

export interface HistoryStats {
  startPrice: number;
  endPrice: number;
  changeAbsolute: number;
  changePercent: number;
  pointCount: number;
}

export function computeHistoryStats(
  series: HistoryPoint[]
): HistoryStats | null {
  if (series.length === 0) return null;
  const startPrice = series[0].price_rupiah;
  const endPrice = series[series.length - 1].price_rupiah;
  const changeAbsolute = endPrice - startPrice;
  const changePercent =
    startPrice === 0 ? 0 : (changeAbsolute / startPrice) * 100;
  return {
    startPrice,
    endPrice,
    changeAbsolute,
    changePercent,
    pointCount: series.length,
  };
}
