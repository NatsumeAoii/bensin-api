import { useMemo } from "react";
import type { PriceChangeEvent } from "@/types/api";
import { TimelineEntry } from "@/components/TimelineEntry";

interface PriceChangeTimelineProps {
  events: PriceChangeEvent[];
}

export function PriceChangeTimeline({ events }: PriceChangeTimelineProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PriceChangeEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date);
      if (existing) {
        existing.push(event);
      } else {
        map.set(event.date, [event]);
      }
    }
    return map;
  }, [events]);

  const dates = useMemo(() => Array.from(grouped.keys()), [grouped]);

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <section key={date}>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {date}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-700/60 dark:bg-stone-900">
            <ul className="divide-y divide-stone-100 dark:divide-stone-800" role="list">
              {grouped.get(date)!.map((event, index) => (
                <li key={`${event.province_slug}-${event.product}-${index}`}>
                  <TimelineEntry event={event} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
