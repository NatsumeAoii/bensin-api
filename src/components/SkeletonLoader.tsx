interface SkeletonLoaderProps {
  count: number;
}

/**
 * Renders skeleton placeholders matching PriceCard approximate dimensions.
 * Uses a shimmer animation for a polished loading experience.
 */
export function SkeletonLoader({ count }: SkeletonLoaderProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Memuat data harga"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 dark:border-stone-700/60 dark:bg-stone-900"
        >
          {/* Accent bar skeleton */}
          <div className="absolute inset-x-0 top-0 h-1 shimmer" />

          {/* Icon + name row */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg shimmer" />
            <div className="h-4 w-24 rounded-md shimmer" />
          </div>

          {/* Price */}
          <div className="mt-4 h-7 w-28 rounded-lg shimmer" />

          {/* Badge */}
          <div className="mt-3 h-6 w-20 rounded-full shimmer" />
        </div>
      ))}
    </div>
  );
}
