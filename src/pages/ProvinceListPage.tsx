import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MapPin, ChevronRight, Fuel, TrendingUp } from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { isValidSlug } from "@/utils/slug";
import { filterProvinces } from "@/utils/search";
import { SearchFilter } from "@/components/SearchFilter";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { RefreshButton } from "@/components/RefreshButton";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { BookmarkButton } from "@/components/BookmarkButton";
import { BookmarkedSection } from "@/components/BookmarkedSection";
import { formatSyncTime } from "@/utils/date";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/use-document-title";
import { useMetaTags } from "@/utils/meta-tags";
import { useJsonLd, websiteSchema } from "@/utils/structured-data";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";
import { useDataChangeAnnouncer } from "@/utils/use-data-change-announcer";
import { useTranslation } from "@/i18n";
import type { IndexProvinceEntry } from "@/types/api";

const MAX_RETRY = 3;

/**
 * Province List Page — main landing page showing all provinces.
 * Features a hero header with stats and a searchable province grid.
 */
export default function ProvinceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const index = useFuelStore((state) => state.index);
  const indexLoading = useFuelStore((state) => state.indexLoading);
  const indexError = useFuelStore((state) => state.indexError);
  const retryCount = useFuelStore((state) => state.retryCount);
  const fetchIndex = useFuelStore((state) => state.fetchIndex);
  const retry = useFuelStore((state) => state.retry);
  const mergeBookmarks = useBookmarkStore((s) => s.mergeBookmarks);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  useDocumentTitle(t("nav.provinces"));
  useCanonicalUrl("/");
  useMetaTags({ title: t("home.title"), description: t("home.subtitle") });
  useJsonLd(websiteSchema());

  const announceRef = useRef<HTMLDivElement>(null);

  const handleVisibilityRefresh = useCallback(() => {
    fetchIndex(true);
  }, [fetchIndex]);

  useVisibilityRefresh(handleVisibilityRefresh);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  // URL bookmark merge: read ?bookmarks= on mount
  useEffect(() => {
    const param = searchParams.get("bookmarks");
    if (!param) return;
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidSlug(s));
    if (slugs.length > 0) {
      mergeBookmarks(slugs);
    }
    searchParams.delete("bookmarks");
    setSearchParams(searchParams, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const provinces: IndexProvinceEntry[] = useMemo(
    () => (index ? Object.values(index.provinsi) : []),
    [index]
  );

  const provinceNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of provinces) {
      map[p.slug] = p.name;
    }
    return map;
  }, [provinces]);

  const sortedProvinces = useMemo(
    () => [...provinces].sort((a, b) => a.name.localeCompare(b.name, "id")),
    [provinces]
  );

  const filteredProvinces = filterProvinces(sortedProvinces, searchQuery);

  useDataChangeAnnouncer(
    index ? `${provinces.length}-${index.synced_at}` : null,
    announceRef,
    t("stats.provinces", { count: provinces.length })
  );

  const retryDisabled = (retryCount["index"] ?? 0) >= MAX_RETRY;

  function handleProvinceSelect(slug: string) {
    navigate(`/provinsi/${slug}`);
  }

  function handleRetry() {
    retry("index");
  }

  function handleClearFilter() {
    setSearchQuery("");
  }

  function handleRefresh() {
    fetchIndex(true);
  }

  return (
    <div>
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero-light p-6 sm:p-10 dark:bg-gradient-hero bg-mesh">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
              <Fuel size={24} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
                {t("home.title")}
              </h1>
              <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                {t("home.subtitle")}
              </p>
            </div>
          </div>

          {/* Stats row */}
          {!indexLoading && !indexError && provinces.length > 0 && index && (
            <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm dark:bg-stone-800/70">
                <MapPin
                  size={16}
                  className="text-orange-500"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {t("stats.provinces", { count: provinces.length })}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm dark:bg-stone-800/70">
                <TrendingUp
                  size={16}
                  className="text-emerald-500"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {t("home.updated", { time: formatSyncTime(index.synced_at) })}
                </span>
              </div>
              <RefreshButton onRefresh={handleRefresh} loading={indexLoading} />
            </div>
          )}
        </div>

        {/* Decorative gradient blob */}
        <div
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/10 blur-3xl"
          aria-hidden="true"
        />
      </section>

      {/* Search + Content */}
      <section className="mt-6">
        {/* Aria-live region */}
        <div
          ref={announceRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Stale time banner */}
        {index && (
          <div className="mb-5">
            <StaleTimeBanner syncedAt={index.synced_at} />
          </div>
        )}

        {/* Loading state */}
        {indexLoading && <ProvinceListSkeleton />}

        {/* Error state */}
        {!indexLoading && indexError && (
          <ErrorState
            message={indexError.message}
            onRetry={handleRetry}
            disabled={retryDisabled}
          />
        )}

        {/* Success state */}
        {!indexLoading && !indexError && provinces.length > 0 && (
          <>
            {/* Bookmarked section */}
            {bookmarks.length > 0 && (
              <BookmarkedSection provinceNames={provinceNames} />
            )}

            {/* Search */}
            <div className="mb-5">
              <SearchFilter
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t("search.placeholder")}
                label={t("search.label")}
              />
            </div>

            {filteredProvinces.length === 0 ? (
              <EmptyState
                message={t("search.noResults")}
                action={{
                  label: t("search.clearFilter"),
                  onClick: handleClearFilter,
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProvinces.map((province) => (
                  <div key={province.slug} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleProvinceSelect(province.slug)}
                      className="touch-active flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 text-left card-glow transition-all hover:border-orange-200 hover:bg-orange-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700/60 dark:bg-stone-900 dark:hover:border-orange-800/50 dark:hover:bg-orange-950/20"
                      aria-label={`${province.name}, ${province.products_count} ${t("detail.productCount", { count: province.products_count })}`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 transition-colors group-hover:bg-orange-100 dark:bg-stone-800 dark:group-hover:bg-orange-900/30">
                          <MapPin
                            size={16}
                            className="text-stone-500 transition-colors group-hover:text-orange-600 dark:text-stone-400 dark:group-hover:text-orange-400"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          {province.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          {province.products_count}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-stone-400 transition-transform group-hover:translate-x-0.5 dark:text-stone-500"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                    <div className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <BookmarkButton slug={province.slug} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/**
 * Skeleton loader for the province list — shimmer animation placeholders.
 */
function ProvinceListSkeleton() {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" aria-label={t("loading.provinceList")}>
      {/* Search skeleton */}
      <div className="mb-5 h-12 w-full rounded-xl shimmer" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 dark:border-stone-700/60 dark:bg-stone-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg shimmer" />
              <div className="h-4 w-28 rounded-md shimmer" />
            </div>
            <div className="h-6 w-8 rounded-full shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
