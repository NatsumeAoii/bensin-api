import { useEffect, useMemo, useState, useCallback } from "react";
import { History, Clock, MapPin } from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { formatSyncTime } from "@/utils/date";
import { filterByName } from "@/utils/search";
import { getProductColor } from "@/utils/products";
import type { PriceChangeEvent } from "@/types/api";
import { SearchFilter } from "@/components/SearchFilter";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { RefreshButton } from "@/components/RefreshButton";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { PriceChangeTimeline } from "@/components/PriceChangeTimeline";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/use-document-title";
import { useMetaTags } from "@/utils/meta-tags";
import { useJsonLd, webPageSchema } from "@/utils/structured-data";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";
import { useTranslation } from "@/i18n";

type DateRange = "7d" | "30d" | "all";

function filterByDateRange(
  events: PriceChangeEvent[],
  range: DateRange
): PriceChangeEvent[] {
  if (range === "all") return events;
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return events.filter((e) => e.date >= cutoffStr);
}

export default function PriceChangePage() {
  const { t } = useTranslation();
  const {
    historyFeed,
    historyFeedLoading,
    historyFeedError,
    historyFeedSyncedAt,
    retryCount,
    fetchHistoryFeed,
    retry,
  } = useFuelStore();

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useDocumentTitle(t("changes.title"));
  useCanonicalUrl("/perubahan");
  useMetaTags({
    title: t("changes.title"),
    description: "Riwayat perubahan harga BBM seluruh provinsi di Indonesia",
  });
  useJsonLd(webPageSchema(t("changes.title")));

  const handleVisibilityRefresh = useCallback(() => {
    fetchHistoryFeed(true);
  }, [fetchHistoryFeed]);

  useVisibilityRefresh(handleVisibilityRefresh);

  useEffect(() => {
    fetchHistoryFeed();
  }, [fetchHistoryFeed]);

  const products = useMemo(() => {
    if (!historyFeed) return [];
    const names = new Set<string>();
    for (const event of historyFeed) {
      names.add(event.product);
    }
    return Array.from(names);
  }, [historyFeed]);

  const effectiveProduct =
    selectedProduct || (products.length > 0 ? products[0] : "");

  const filteredEvents = useMemo(() => {
    if (!historyFeed) return [];
    let events = historyFeed;
    if (effectiveProduct) {
      events = events.filter((e) => e.product === effectiveProduct);
    }
    events = filterByDateRange(events, dateRange);
    events = filterByName(events, (e) => e.province, searchQuery);
    return events;
  }, [historyFeed, effectiveProduct, dateRange, searchQuery]);

  if (historyFeedLoading && !historyFeed) {
    return (
      <div>
        <div className="mb-6 rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
          <div className="h-8 w-48 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-32 rounded-md shimmer" />
        </div>
        <SkeletonLoader count={6} />
      </div>
    );
  }

  if (historyFeedError && !historyFeed) {
    return (
      <div>
        <ChangesHeader />
        <div className="mt-6">
          <ErrorState
            message={historyFeedError.message}
            onRetry={() => retry("historyFeed")}
            disabled={(retryCount["historyFeed"] ?? 0) >= 3}
          />
        </div>
      </div>
    );
  }

  function handleRefresh() {
    fetchHistoryFeed(true);
  }

  return (
    <div>
      <ChangesHeader
        totalChanges={historyFeed?.length}
        syncedAt={historyFeedSyncedAt ?? undefined}
        onRefresh={handleRefresh}
        loading={historyFeedLoading}
      />

      {historyFeedSyncedAt && (
        <div className="mt-4">
          <StaleTimeBanner syncedAt={historyFeedSyncedAt} />
        </div>
      )}

      <nav aria-label={t("changes.dateRange")} className="mt-6">
        <div className="flex flex-wrap gap-2" role="group">
          {products.map((name) => {
            const isActive = effectiveProduct === name;
            const color = getProductColor(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedProduct(name)}
                aria-pressed={isActive}
                className={`min-h-[44px] min-w-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  isActive
                    ? "text-white shadow-md"
                    : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                        boxShadow: `0 4px 12px ${color.from}33`,
                      }
                    : undefined
                }
              >
                {name}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("changes.dateRange")}>
        {([
          { key: "7d" as const, label: t("changes.7days") },
          { key: "30d" as const, label: t("changes.30days") },
          { key: "all" as const, label: t("changes.allTime") },
        ]).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setDateRange(opt.key)}
            aria-pressed={dateRange === opt.key}
            className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
              dateRange === opt.key
                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <SearchFilter
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("changes.searchProvince")}
          label={t("changes.searchProvince")}
        />
      </div>

      <section className="mt-6" aria-label={t("changes.title")}>
        {filteredEvents.length === 0 ? (
          <EmptyState message={t("changes.empty")} />
        ) : (
          <PriceChangeTimeline events={filteredEvents} />
        )}
      </section>
    </div>
  );
}

interface ChangesHeaderProps {
  totalChanges?: number;
  syncedAt?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

function ChangesHeader({
  totalChanges,
  syncedAt,
  onRefresh,
  loading = false,
}: ChangesHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/20">
            <History size={20} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
              {t("changes.title")}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
              {totalChanges !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {t("changes.totalChanges", { count: totalChanges })}
                </span>
              )}
              {syncedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" />
                  {t("national.updated", { time: formatSyncTime(syncedAt) })}
                </span>
              )}
            </div>
          </div>
        </div>
        {onRefresh && <RefreshButton onRefresh={onRefresh} loading={loading} />}
      </div>
    </header>
  );
}
