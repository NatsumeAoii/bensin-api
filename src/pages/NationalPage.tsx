import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import {
  BarChart3,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { sortByPrice } from "@/utils/sort";
import { groupByRegion, REGION_MAP } from "@/utils/regions";
import { extractDistinctProducts, getProductColor } from "@/utils/products";
import { formatPrice, formatRupiah } from "@/utils/format";
import { formatSyncTime } from "@/utils/date";
import { filterByName } from "@/utils/search";
import { SearchFilter } from "@/components/SearchFilter";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { RefreshButton } from "@/components/RefreshButton";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { RegionGroup } from "@/components/RegionGroup";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/use-document-title";
import { useMetaTags } from "@/utils/meta-tags";
import { useJsonLd, webPageSchema } from "@/utils/structured-data";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";
import { useDataChangeAnnouncer } from "@/utils/use-data-change-announcer";
import { useTranslation } from "@/i18n";

/**
 * National Page — displays fuel price comparison across all provinces.
 * Features a product selector with colored pills and a ranked province list.
 */
export default function NationalPage() {
  const { t } = useTranslation();
  const {
    national,
    nationalLoading,
    nationalError,
    retryCount,
    fetchNational,
    retry,
  } = useFuelStore();

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    searchParams.get("sort") === "desc" ? "desc" : "asc"
  );
  const [groupByIsland, setGroupByIsland] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const announceRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(t("national.title"));
  useCanonicalUrl("/nasional");
  useMetaTags({
    title: t("national.title"),
    description: "Perbandingan harga BBM seluruh provinsi di Indonesia",
  });
  useJsonLd(webPageSchema(t("national.title")));

  const handleVisibilityRefresh = useCallback(() => {
    fetchNational(true);
  }, [fetchNational]);

  useVisibilityRefresh(handleVisibilityRefresh);

  useEffect(() => {
    fetchNational();
  }, [fetchNational]);

  const productNames = useMemo(() => {
    if (!national) return [];
    return extractDistinctProducts(national.provinces);
  }, [national]);

  // Derive the effective selected product — no effect needed
  const effectiveProduct =
    selectedProduct || (productNames.length > 0 ? productNames[0] : "");

  function handleToggleSort() {
    const next = sortDir === "asc" ? "desc" : "asc";
    setSortDir(next);
    if (next === "desc") {
      setSearchParams(
        (p) => {
          p.set("sort", "desc");
          return p;
        },
        { replace: true }
      );
    } else {
      setSearchParams(
        (p) => {
          p.delete("sort");
          return p;
        },
        { replace: true }
      );
    }
  }

  const sortedProvinces = useMemo(() => {
    if (!national || !effectiveProduct) return [];
    return sortByPrice(national.provinces, effectiveProduct, sortDir);
  }, [national, effectiveProduct, sortDir]);

  // Availability filter
  const availabilityFiltered = useMemo(() => {
    if (availabilityFilter === "all") return sortedProvinces;
    return sortedProvinces.filter((p) => {
      const found = p.products.find((pr) => pr.product === effectiveProduct);
      if (!found) return availabilityFilter === "unavailable";
      return availabilityFilter === "available"
        ? found.availability === "available"
        : found.availability !== "available";
    });
  }, [sortedProvinces, availabilityFilter, effectiveProduct]);

  const filteredProvinces = useMemo(
    () => filterByName(availabilityFiltered, (p) => p.province, searchQuery),
    [availabilityFiltered, searchQuery]
  );

  // Availability counts
  const availabilityCounts = useMemo(() => {
    let available = 0;
    let unavailable = 0;
    for (const p of sortedProvinces) {
      const found = p.products.find((pr) => pr.product === effectiveProduct);
      if (found?.availability === "available") available++;
      else unavailable++;
    }
    return { all: sortedProvinces.length, available, unavailable };
  }, [sortedProvinces, effectiveProduct]);

  // Single pass over the filtered list builds the per-province price lookup
  // and the lowest/highest extremes used for ranking highlights.
  const { priceMap, lowestPrice, highestPrice, averagePrice } = useMemo(() => {
    const map = new Map<string, number | null>();
    let lowest: number | null = null;
    let highest: number | null = null;
    let sum = 0;
    let count = 0;
    for (const province of filteredProvinces) {
      const found = province.products.find(
        (prod) => prod.product === effectiveProduct
      );
      const price = found?.price_rupiah ?? null;
      map.set(province.province_slug, price);
      if (price !== null) {
        if (lowest === null || price < lowest) lowest = price;
        if (highest === null || price > highest) highest = price;
        sum += price;
        count++;
      }
    }
    const avg = count > 0 ? Math.round(sum / count) : null;
    return {
      priceMap: map,
      lowestPrice: lowest,
      highestPrice: highest,
      averagePrice: avg,
    };
  }, [filteredProvinces, effectiveProduct]);

  useDataChangeAnnouncer(
    national
      ? `${national.provinces.length}-${national.pertamina_updated_at}`
      : null,
    announceRef,
    national
      ? t("announce.nationalUpdated", { count: national.provinces.length })
      : ""
  );

  // Loading state
  if (nationalLoading && !national) {
    return (
      <div>
        <div className="mb-6 rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
          <div className="h-8 w-48 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-32 rounded-md shimmer" />
        </div>
        <SkeletonLoader count={9} />
      </div>
    );
  }

  // Error state
  if (nationalError && !national) {
    return (
      <div>
        <NationalHeader />
        <div className="mt-6">
          <ErrorState
            message={nationalError.message}
            onRetry={() => retry("national")}
            disabled={(retryCount["national"] ?? 0) >= 3}
          />
        </div>
      </div>
    );
  }

  if (!national) return null;

  function handleRefresh() {
    fetchNational(true);
  }

  return (
    <div>
      {/* Hero header */}
      <NationalHeader
        provinceCount={national.provinces.length}
        syncedAt={national.synced_at}
        onRefresh={handleRefresh}
        loading={nationalLoading}
      />

      {/* Stale time banner */}
      <div className="mt-4">
        <StaleTimeBanner syncedAt={national.synced_at} />
      </div>

      {/* Product selector pills */}
      <nav aria-label={t("national.selectProduct")} className="mt-6">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("national.products")}
        >
          {productNames.map((name) => {
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

      {/* Sort + Region controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSort}
          aria-label={
            sortDir === "asc" ? t("national.sortDesc") : t("national.sortAsc")
          }
          className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-all hover:border-stone-300 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600"
        >
          <ArrowUpDown size={14} aria-hidden="true" />
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
        <button
          type="button"
          onClick={() => setGroupByIsland((v) => !v)}
          aria-pressed={groupByIsland}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
            groupByIsland
              ? "bg-orange-500 text-white shadow-md"
              : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600"
          }`}
        >
          <Layers size={14} aria-hidden="true" />
          {t("national.groupByRegion")}
        </button>
      </div>

      {/* Price stats bar */}
      {(lowestPrice !== null || averagePrice !== null) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {lowestPrice !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 dark:bg-emerald-950/30">
              <TrendingDown
                size={14}
                className="text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {t("national.cheapestPrice", {
                  price: formatPrice(lowestPrice, t("price.unavailableLabel")),
                })}
              </span>
            </div>
          )}
          {averagePrice !== null && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3.5 py-2 dark:border-stone-600">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                {t("national.averagePrice", {
                  price: formatRupiah(averagePrice),
                })}
              </span>
            </div>
          )}
          {highestPrice !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 dark:bg-red-950/30">
              <TrendingUp
                size={14}
                className="text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                {t("national.mostExpensivePrice", {
                  price: formatPrice(highestPrice, t("price.unavailableLabel")),
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Availability filter pills */}
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter ketersediaan"
      >
        {[
          {
            key: "all" as const,
            label: t("national.filterAll"),
            count: availabilityCounts.all,
          },
          {
            key: "available" as const,
            label: t("national.filterAvailable"),
            count: availabilityCounts.available,
          },
          {
            key: "unavailable" as const,
            label: t("national.filterUnavailable"),
            count: availabilityCounts.unavailable,
          },
        ].map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setAvailabilityFilter(opt.key)}
            aria-pressed={availabilityFilter === opt.key}
            className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
              availabilityFilter === opt.key
                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
            }`}
          >
            {opt.label}
            <span className="ml-1.5 rounded-full bg-stone-200/60 px-1.5 py-0.5 text-[10px] font-bold dark:bg-stone-700/60">
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search filter */}
      <div className="mt-5">
        <SearchFilter
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("search.placeholder")}
          label={t("search.label")}
        />
      </div>

      {/* Aria-live region */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Province ranking list */}
      <section
        className="mt-5"
        aria-label={t("national.pricePerProvince", {
          product: effectiveProduct,
        })}
      >
        {effectiveProduct && (
          <h2 className="mb-3 text-sm font-bold text-stone-700 dark:text-stone-300">
            {t("national.pricePerProvince", { product: effectiveProduct })}
          </h2>
        )}
        {filteredProvinces.length === 0 ? (
          <EmptyState
            message={t("search.noResults")}
            action={{
              label: t("search.clearFilter"),
              onClick: () => setSearchQuery(""),
            }}
          />
        ) : groupByIsland ? (
          <div className="space-y-3">
            {(() => {
              const groups = groupByRegion(filteredProvinces);
              const regionEntries = [...groups.entries()].map(
                ([key, provinces]) => {
                  const region = REGION_MAP[key];
                  const prices: number[] = [];
                  for (const p of provinces) {
                    const found = p.products.find(
                      (pr) => pr.product === effectiveProduct
                    );
                    if (found?.price_rupiah != null)
                      prices.push(found.price_rupiah);
                  }
                  const avg =
                    prices.length > 0
                      ? prices.reduce((a, b) => a + b, 0) / prices.length
                      : Infinity;
                  return { key, region, provinces, avg };
                }
              );
              regionEntries.sort((a, b) => a.avg - b.avg);
              return regionEntries.map(({ key, region, provinces }) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-700/60 dark:bg-stone-900"
                >
                  <RegionGroup
                    name={region.name}
                    provinces={provinces}
                    product={effectiveProduct}
                    lowestPrice={lowestPrice}
                    highestPrice={highestPrice}
                  />
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-700/60 dark:bg-stone-900">
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredProvinces.map((province, index) => {
                const price = priceMap.get(province.province_slug) ?? null;
                const isLowest = price === lowestPrice && price !== null;
                const isHighest = price === highestPrice && price !== null;

                return (
                  <li key={province.province_slug}>
                    <Link
                      to={`/provinsi/${province.province_slug}`}
                      className="touch-active flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank number */}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          {province.province}
                        </span>
                      </div>
                      <span className="flex items-center gap-2">
                        {/* Text marker so cheapest/priciest is not conveyed by
                            color alone (accessibility). */}
                        {isLowest && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {t("national.cheapest")}
                          </span>
                        )}
                        {isHighest && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            {t("national.mostExpensive")}
                          </span>
                        )}
                        <span
                          className={`text-sm font-bold ${
                            price === null
                              ? "text-stone-400 dark:text-stone-600"
                              : isLowest
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isHighest
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-stone-900 dark:text-stone-100"
                          }`}
                        >
                          {formatPrice(price, t("price.unavailableLabel"))}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

interface NationalHeaderProps {
  provinceCount?: number;
  syncedAt?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

function NationalHeader({
  provinceCount,
  syncedAt,
  onRefresh,
  loading = false,
}: NationalHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/20">
            <BarChart3 size={20} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
              {t("national.title")}
            </h1>
            {provinceCount !== undefined && syncedAt && (
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {t("national.provinceCount", { count: provinceCount })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" />
                  {t("national.updated", { time: formatSyncTime(syncedAt) })}
                </span>
              </div>
            )}
          </div>
        </div>
        {onRefresh && <RefreshButton onRefresh={onRefresh} loading={loading} />}
      </div>
    </header>
  );
}
