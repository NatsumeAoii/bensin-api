import type { HistoryPoint, PriceChangeEvent } from "@/types/api";

interface ProvinceHistory {
  slug: string;
  name: string;
  products: Record<string, HistoryPoint[]>;
}

export function buildChangeFeed(
  histories: ProvinceHistory[]
): PriceChangeEvent[] {
  const events: PriceChangeEvent[] = [];

  for (const province of histories) {
    for (const [product, points] of Object.entries(province.products)) {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        if (curr.price_rupiah === prev.price_rupiah) continue;
        const changeAbsolute = curr.price_rupiah - prev.price_rupiah;
        const changePercent =
          prev.price_rupiah !== 0
            ? (changeAbsolute / prev.price_rupiah) * 100
            : 0;
        events.push({
          date: curr.date,
          province: province.name,
          province_slug: province.slug,
          product,
          old_price: prev.price_rupiah,
          new_price: curr.price_rupiah,
          change_absolute: changeAbsolute,
          change_percent: Math.round(changePercent * 100) / 100,
        });
      }
    }
  }

  events.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return a.province.localeCompare(b.province);
  });

  return events;
}
