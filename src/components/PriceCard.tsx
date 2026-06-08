import { CheckCircle2, XCircle, HelpCircle, Droplets } from "lucide-react";
import type { Product, Availability } from "@/types/api";
import { formatPrice } from "@/utils/format";
import { getProductColor } from "@/utils/products";

interface PriceCardProps {
  product: Product;
}

const availabilityConfig: Record<
  Availability,
  {
    label: string;
    icon: typeof CheckCircle2;
    colorClass: string;
    bgClass: string;
  }
> = {
  available: {
    label: "Tersedia",
    icon: CheckCircle2,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  unavailable: {
    label: "Tidak Tersedia",
    icon: XCircle,
    colorClass: "text-red-500 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/40",
  },
  unknown: {
    label: "Tidak Diketahui",
    icon: HelpCircle,
    colorClass: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
  },
};

export function PriceCard({ product }: PriceCardProps) {
  const { product: productName, price_rupiah, availability } = product;
  const priceDisplay = formatPrice(price_rupiah);
  const config = availabilityConfig[availability];
  const Icon = config.icon;
  const productColor = getProductColor(productName);

  const ariaLabel = `${productName}, ${priceDisplay}, ${config.label}`;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 card-glow transition-all duration-200 hover:border-stone-300/80 dark:border-stone-700/60 dark:bg-stone-900 dark:hover:border-stone-600/60"
      aria-label={ariaLabel}
    >
      {/* Subtle accent bar at top */}
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, ${productColor.from}, ${productColor.to})`,
        }}
        aria-hidden="true"
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${productColor.from}20, ${productColor.to}20)`,
            }}
          >
            <Droplets
              size={18}
              style={{ color: productColor.from }}
              aria-hidden="true"
            />
          </div>
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {productName}
          </h3>
        </div>
      </div>

      {/* Price */}
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">
        {priceDisplay}
      </p>

      {/* Availability badge */}
      <div
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${config.bgClass}`}
      >
        <Icon size={14} aria-hidden="true" className={config.colorClass} />
        <span className={`text-xs font-medium ${config.colorClass}`}>
          {config.label}
        </span>
      </div>
    </article>
  );
}
