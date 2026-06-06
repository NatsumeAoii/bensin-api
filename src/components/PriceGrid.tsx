import type { Product } from "@/types/api";
import { PriceCard } from "@/components/PriceCard";

interface PriceGridProps {
  products: Product[];
}

/**
 * Responsive grid layout that renders a PriceCard for each product.
 * 1 column below 640px, 2 columns 640-1024px, 3 columns above 1024px.
 */
export function PriceGrid({ products }: PriceGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      {products.map((product) => (
        <div key={product.product} role="listitem">
          <PriceCard product={product} />
        </div>
      ))}
    </div>
  );
}
