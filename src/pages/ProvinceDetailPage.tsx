import { useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { formatSyncTime } from "@/utils/date";
import { isValidSlug } from "@/utils/slug";
import { useDocumentTitle } from "@/utils/use-document-title";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";
import { PriceGrid } from "@/components/PriceGrid";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { ShareButton } from "@/components/ShareButton";
import { RefreshButton } from "@/components/RefreshButton";

/**
 * Province Detail Page — displays fuel prices for a selected province.
 * Route: /provinsi/:slug
 */
export default function ProvinceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    provinces,
    provinceLoading,
    provinceError,
    retryCount,
    fetchProvince,
    retry,
  } = useFuelStore();

  const previousDataRef = useRef<string | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  const loading = slug ? provinceLoading[slug] ?? false : false;
  const error = slug ? provinceError[slug] ?? null : null;
  const data = slug ? provinces[slug] ?? null : null;
  const requestKey = slug ? `province:${slug}` : "";
  const currentRetryCount = retryCount[requestKey] ?? 0;
  const retryDisabled = currentRetryCount >= 3;

  const slugValid = isValidSlug(slug);

  useDocumentTitle(data ? data.province : null);

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

  useEffect(() => {
    if (!data) return;

    const dataFingerprint = `${data.province}-${data.synced_at}-${data.products.length}`;

    if (previousDataRef.current !== null && previousDataRef.current !== dataFingerprint) {
      if (announceRef.current) {
        announceRef.current.textContent = `Data harga ${data.province} telah diperbarui`;
      }
    }

    previousDataRef.current = dataFingerprint;
  }, [data]);

  // Invalid or missing slug — render 404 immediately without network request
  if (!slugValid) {
    return (
      <main>
        <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
            <MapPin className="h-8 w-8 text-stone-400 dark:text-stone-500" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Provinsi tidak ditemukan
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Data untuk provinsi ini tidak tersedia.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Kembali ke daftar provinsi
          </Link>
        </div>
      </main>
    );
  }

  // 404 error
  if (!loading && error && error.status === 404) {
    return (
      <main>
        <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
            <MapPin className="h-8 w-8 text-stone-400 dark:text-stone-500" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Provinsi tidak ditemukan
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Data untuk provinsi ini tidak tersedia.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Kembali ke daftar provinsi
          </Link>
        </div>
      </main>
    );
  }

  // Loading state
  if (loading && !data) {
    return (
      <main>
        <div className="mb-6">
          <div className="h-6 w-20 rounded-md shimmer" />
          <div className="mt-4 h-8 w-48 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-32 rounded-md shimmer" />
        </div>
        <SkeletonLoader count={9} />
      </main>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <main>
        <BackLink />
        <div className="mt-6">
          <ErrorState
            message={error.message}
            onRetry={() => retry(requestKey)}
            disabled={retryDisabled}
          />
        </div>
      </main>
    );
  }

  // Empty products
  if (data && data.products.length === 0) {
    return (
      <main>
        <BackLink provinceName={data.province} />
        <ProvinceHeader name={data.province} syncedAt={data.synced_at} />
        <div className="mt-6">
          <EmptyState message="Tidak ada data harga untuk provinsi ini" />
        </div>
        <div ref={announceRef} aria-live="polite" className="sr-only" />
      </main>
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
      <main>
        <BackLink provinceName={data.province} />
        <ProvinceHeader name={data.province} syncedAt={data.synced_at} productCount={data.products.length} />

        {/* Action bar: Share + Refresh */}
        <div className="mt-4 flex items-center gap-2">
          <ShareButton
            title={`Harga BBM ${data.province}`}
            text={`Lihat harga BBM terbaru di ${data.province}`}
          />
          <RefreshButton onRefresh={handleRefresh} loading={loading} />
        </div>

        {hasStaleData && (
          <div className="mt-4">
            <StaleDataBanner visible={hasStaleData} />
          </div>
        )}

        {!hasStaleData && (
          <div className="mt-4">
            <StaleTimeBanner updatedAt={data.pertamina_updated_at} />
          </div>
        )}

        <div className="mt-6">
          <PriceGrid products={data.products} />
        </div>

        <div ref={announceRef} aria-live="polite" className="sr-only" />
      </main>
    );
  }

  return null;
}

function BackLink({ provinceName }: { provinceName?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-stone-500 transition-colors hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-400 dark:hover:text-orange-400"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Provinsi
      </Link>
      {provinceName && (
        <>
          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">/</span>
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {provinceName}
          </span>
        </>
      )}
    </nav>
  );
}

interface ProvinceHeaderProps {
  name: string;
  syncedAt: string;
  productCount?: number;
}

function ProvinceHeader({ name, syncedAt, productCount }: ProvinceHeaderProps) {
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
              Diperbarui {formatSyncTime(syncedAt)}
            </span>
            {productCount !== undefined && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {productCount} produk
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
