import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import { BarChart3, Clock, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { useFuelStore } from "@/stores/fuel-store";
import { sortByPrice } from "@/utils/sort";
import { extractDistinctProducts, getProductColor } from "@/utils/products";
import { formatPrice } from "@/utils/format";
import { formatSyncTime } from "@/utils/date";
import { SearchFilter } from "@/components/SearchFilter";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { RefreshButton } from "@/components/RefreshButton";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";
import { useDocumentTitle } from "@/utils/use-document-title";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";

/**
 * National Page — displays fuel price comparison across all provinces.
 * Features a product selector with colored pills and a ranked province list.
 */
export default function NationalPage() {
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
  const previousDataRef = useRef<string | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  useDocumentTitle("Perbandingan Nasional");

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
  const effectiveProduct = selectedProduct || (productNames.length > 0 ? productNames[0] : "");

  const sortedProvinces = useMemo(() => {
    if (!national || !effectiveProduct) return [];
    return sortByPrice(national.provinces, effectiveProduct);
  }, [national, effectiveProduct]);

  const filteredProvinces = useMemo(() => {
    if (!searchQuery) return sortedProvinces;
    const normalized = searchQuery.slice(0, 100).toLowerCase();
    return sortedProvinces.filter((province) =>
      province.province.toLowerCase().includes(normalized)
    );
  }, [sortedProvinces, searchQuery]);

  // Calculate price stats and price map for context — single pass
  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const p of filteredProvinces) {
      const found = p.products.find((prod) => prod.product === effectiveProduct);
      map.set(p.province_slug, found?.price_rupiah ?? null);
    }
    return map;
  }, [filteredProvinces, effectiveProduct]);

  const { lowestPrice, highestPrice } = useMemo(() => {
    let lowest: number | null = null;
    let highest: number | null = null;
    for (const price of priceMap.values()) {
      if (price !== null) {
        if (lowest === null || price < lowest) lowest = price;
        if (highest === null || price > highest) highest = price;
      }
    }
    return { lowestPrice: lowest, highestPrice: highest };
  }, [priceMap]);

  useEffect(() => {
    if (!national) return;
    const dataFingerprint = `${national.provinces.length}-${national.pertamina_updated_at}`;
    if (previousDataRef.current !== null && previousDataRef.current !== dataFingerprint) {
      if (announceRef.current) {
        announceRef.current.textContent = `Data diperbarui. ${national.provinces.length} provinsi tersedia.`;
      }
    }
    previousDataRef.current = dataFingerprint;
  }, [national]);

  // Loading state
  if (nationalLoading && !national) {
    return (
      <main>
        <div className="mb-6 rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
          <div className="h-8 w-48 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-32 rounded-md shimmer" />
        </div>
        <SkeletonLoader count={9} />
      </main>
    );
  }

  // Error state
  if (nationalError && !national) {
    return (
      <main>
        <NationalHeader />
        <div className="mt-6">
          <ErrorState
            message={nationalError.message}
            onRetry={() => retry("national")}
            disabled={(retryCount["national"] ?? 0) >= 3}
          />
        </div>
      </main>
    );
  }

  if (!national) return null;

  function handleRefresh() {
    fetchNational(true);
  }

  return (
    <main>
      {/* Hero header */}
      <NationalHeader
        provinceCount={national.provinces.length}
        updatedAt={national.pertamina_updated_at}
        onRefresh={handleRefresh}
        loading={nationalLoading}
      />

      {/* Stale time banner */}
      <div className="mt-4">
        <StaleTimeBanner updatedAt={national.pertamina_updated_at} />
      </div>

      {/* Product selector pills */}
      <nav aria-label="Pilih produk BBM" className="mt-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Produk BBM">
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
                    ? { background: `linear-gradient(135deg, ${color.from}, ${color.to})`, boxShadow: `0 4px 12px ${color.from}33` }
                    : undefined
                }
              >
                {name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Price stats bar */}
      {lowestPrice !== null && highestPrice !== null && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 dark:bg-emerald-950/30">
            <TrendingDown size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Termurah: {formatPrice(lowestPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 dark:bg-red-950/30">
            <TrendingUp size={14} className="text-red-600 dark:text-red-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              Termahal: {formatPrice(highestPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Search filter */}
      <div className="mt-5">
        <SearchFilter
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari provinsi..."
          label="Cari provinsi"
        />
      </div>

      {/* Aria-live region */}
      <div ref={announceRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Province ranking list */}
      <section className="mt-5" aria-label="Daftar harga per provinsi">
        {filteredProvinces.length === 0 ? (
          <EmptyState
            message="Tidak ada provinsi yang cocok dengan pencarian"
            action={{ label: "Hapus filter", onClick: () => setSearchQuery("") }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-700/60 dark:bg-stone-900">
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredProvinces.map((province, index) => {
                const price = priceMap.get(province.province_slug) ?? null;
                const isLowest = price === lowestPrice && price !== null;
                const isHighest = price === highestPrice && price !== null;

                return (
                  <li
                    key={province.province_slug}
                  >
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
                        {formatPrice(price)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

interface NationalHeaderProps {
  provinceCount?: number;
  updatedAt?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

function NationalHeader({ provinceCount, updatedAt, onRefresh, loading = false }: NationalHeaderProps) {
  return (
    <header className="rounded-2xl bg-gradient-hero-light p-6 dark:bg-gradient-hero bg-mesh">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/20">
            <BarChart3 size={20} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
              Perbandingan Nasional
            </h1>
            {provinceCount !== undefined && updatedAt && (
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {provinceCount} provinsi
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" />
                  Diperbarui {formatSyncTime(updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
        {onRefresh && (
          <RefreshButton onRefresh={onRefresh} loading={loading} />
        )}
      </div>
    </header>
  );
}
