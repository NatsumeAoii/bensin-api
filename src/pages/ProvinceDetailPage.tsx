import { useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, MapPin, Clock } from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { formatSyncTime } from "@/utils/date";
import { isValidSlug } from "@/utils/slug";
import { getAdjacentSlugs } from "@/utils/province-nav";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/use-document-title";
import { useMetaTags } from "@/utils/meta-tags";
import { useJsonLd, datasetSchema } from "@/utils/structured-data";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";
import { useDataChangeAnnouncer } from "@/utils/use-data-change-announcer";
import { PriceGrid } from "@/components/PriceGrid";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { ProvinceNotFound } from "@/components/ProvinceNotFound";
import { ShareButton } from "@/components/ShareButton";
import { RefreshButton } from "@/components/RefreshButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useTranslation } from "@/i18n";

// Lazy-loaded so the SVG chart code stays out of the initial bundle and only
// loads when a user actually opens a province detail page.
const PriceHistoryChart = lazy(() =>
  import("@/components/PriceHistoryChart").then((m) => ({
    default: m.PriceHistoryChart,
  }))
);

/**
 * Province Detail Page — displays fuel prices for a selected province.
 * Route: /provinsi/:slug
 */
export default function ProvinceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    index,
    provinces,
    provinceLoading,
    provinceError,
    retryCount,
    fetchProvince,
    retry,
  } = useFuelStore();

  const announceRef = useRef<HTMLDivElement>(null);

  const loading = slug ? provinceLoading[slug] ?? false : false;
  const error = slug ? provinceError[slug] ?? null : null;
  const data = slug ? provinces[slug] ?? null : null;
  const requestKey = slug ? `province:${slug}` : "";
  const currentRetryCount = retryCount[requestKey] ?? 0;
  const retryDisabled = currentRetryCount >= 3;

  const slugValid = isValidSlug(slug);

  const provinceList = useMemo(
    () => (index ? Object.values(index.provinsi) : []),
    [index]
  );

  const adjacent = useMemo(
    () => (slug ? getAdjacentSlugs(provinceList, slug) : null),
    [provinceList, slug]
  );

  // Keyboard navigation: ArrowLeft/ArrowRight cycle provinces
  useEffect(() => {
    if (!adjacent) return;
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && adjacent?.prev) {
        navigate(`/provinsi/${adjacent.prev.slug}`);
      } else if (e.key === "ArrowRight" && adjacent?.next) {
        navigate(`/provinsi/${adjacent.next.slug}`);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [adjacent, navigate]);

  useDocumentTitle(data ? data.province : null);
  useCanonicalUrl(slugValid && slug ? `/provinsi/${slug}` : null);
  useMetaTags({
    title: data?.province ?? undefined,
    description: data
      ? `Harga BBM di ${data.province} dari Pertamina`
      : undefined,
  });
  useJsonLd(data ? datasetSchema(data.province) : null);

  const handleVisibilityRefresh = useCallback(() => {
    if (slugValid && slug) {
      fetchProvince(slug, true);
    }
  }, [slug, slugValid, fetchProvince]);

  useVisibilityRefresh(handleVisibilityRefresh);

  useEffect(() => {
    if (slugValid) {
      fetchProvince(slug);
    }
  }, [slug, slugValid, fetchProvince]);

  useDataChangeAnnouncer(
    data ? `${data.province}-${data.synced_at}-${data.products.length}` : null,
    announceRef,
    data ? t("announce.provinceUpdated", { province: data.province }) : ""
  );

  // Invalid or missing slug — render 404 immediately without network request
  if (!slugValid) {
    return <ProvinceNotFound />;
  }

  // 404 error
  if (!loading && error && error.status === 404) {
    return <ProvinceNotFound />;
  }

  // Loading state
  if (loading && !data) {
    return (
      <div>
        <div className="mb-6">
          <ProvinceNavSkeleton />
          <div className="mt-4 h-8 w-48 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-32 rounded-md shimmer" />
        </div>
        <SkeletonLoader count={9} />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div>
        <BackLink adjacent={adjacent} total={provinceList.length} />
        <div className="mt-6">
          <ErrorState
            message={error.message}
            onRetry={() => retry(requestKey)}
            disabled={retryDisabled}
          />
        </div>
      </div>
    );
  }

  // Empty products
  if (data && data.products.length === 0) {
    return (
      <div>
        <BackLink
          provinceName={data.province}
          adjacent={adjacent}
          total={provinceList.length}
        />
        <ProvinceHeader name={data.province} syncedAt={data.synced_at} />
        <div className="mt-6">
          <EmptyState message={t("detail.noData")} />
        </div>
        <div ref={announceRef} aria-live="polite" className="sr-only" />
      </div>
    );
  }

  // Success state
  if (data) {
    const hasStaleData = error !== null;

    function handleRefresh() {
      if (slug) {
        fetchProvince(slug, true);
      }
    }

    return (
      <div>
        <BackLink
          provinceName={data.province}
          adjacent={adjacent}
          total={provinceList.length}
        />
        <ProvinceHeader
          name={data.province}
          syncedAt={data.synced_at}
          productCount={data.products.length}
        />

        {/* Action bar: Share + Refresh + Bookmark */}
        <div className="mt-4 flex items-center gap-2">
          <ShareButton
            title={t("share.title", { province: data.province })}
            text={t("share.text", { province: data.province })}
          />
          <RefreshButton onRefresh={handleRefresh} loading={loading} />
          {slug && <BookmarkButton slug={slug} />}
        </div>

        {hasStaleData && (
          <div className="mt-4">
            <StaleDataBanner
              visible={hasStaleData}
              onRetry={retryDisabled ? undefined : () => retry(requestKey)}
            />
          </div>
        )}

        {!hasStaleData && (
          <div className="mt-4">
            <StaleTimeBanner syncedAt={data.synced_at} />
          </div>
        )}

        <div className="mt-6">
          <PriceGrid products={data.products} />
        </div>

        <div className="mt-6">
          <Suspense
            fallback={
              <div
                className="h-[280px] w-full rounded-2xl shimmer"
                aria-busy="true"
              />
            }
          >
            <PriceHistoryChart slug={slug as string} />
          </Suspense>
        </div>

        <div ref={announceRef} aria-live="polite" className="sr-only" />
      </div>
    );
  }

  return null;
}

function BackLink({
  provinceName,
  adjacent,
  total,
}: {
  provinceName?: string;
  adjacent?: {
    prev: { slug: string; name: string } | null;
    next: { slug: string; name: string } | null;
    index: number;
  } | null;
  total?: number;
}) {
  const { t } = useTranslation();
  const showNav = adjacent && total && total > 0;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {showNav && adjacent.prev ? (
        <Link
          to={`/provinsi/${adjacent.prev.slug}`}
          aria-label={t("nav.prevProvince", { name: adjacent.prev.name })}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 py-1 font-medium text-stone-500 transition-colors hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:text-orange-400"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{adjacent.prev.name}</span>
        </Link>
      ) : (
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-stone-500 transition-colors hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:text-orange-400"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t("detail.breadcrumb")}
        </Link>
      )}
      {provinceName && (
        <>
          <span
            className="text-stone-300 dark:text-stone-600"
            aria-hidden="true"
          >
            /
          </span>
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {provinceName}
          </span>
          {showNav && adjacent.index >= 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              {t("nav.provinceCounter", { current: adjacent.index + 1, total })}
            </span>
          )}
        </>
      )}
      {showNav && adjacent.next && (
        <Link
          to={`/provinsi/${adjacent.next.slug}`}
          aria-label={t("nav.nextProvince", { name: adjacent.next.name })}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 py-1 font-medium text-stone-500 transition-colors hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:text-orange-400"
        >
          <span className="hidden sm:inline">{adjacent.next.name}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

function ProvinceNavSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-20 rounded-md shimmer" />
      <div className="h-4 w-4 rounded-full shimmer" />
      <div className="h-6 w-24 rounded-md shimmer" />
    </div>
  );
}

interface ProvinceHeaderProps {
  name: string;
  syncedAt: string;
  productCount?: number;
}

function ProvinceHeader({ name, syncedAt, productCount }: ProvinceHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mt-2 rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/20">
          <MapPin size={20} className="text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
            {name}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {t("detail.updated", { time: formatSyncTime(syncedAt) })}
            </span>
            {productCount !== undefined && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {t("detail.productCount", { count: productCount })}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
