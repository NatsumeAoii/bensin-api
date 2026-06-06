import type { ProvinceResponse } from "@/types/api";

/**
 * Extracts distinct product names from an array of province responses.
 * Uses a Set for O(1) lookup deduplication and returns the names
 * in insertion order (first-seen order across provinces).
 */
export function extractDistinctProducts(
  provinces: ProvinceResponse[]
): string[] {
  const names = new Set<string>();
  for (const province of provinces) {
    for (const product of province.products) {
      names.add(product.product);
    }
  }
  return Array.from(names);
}

/**
 * Color mapping for fuel product types — gives each product a visual identity.
 * Falls back to the brand orange palette for unknown products.
 */

interface ProductColor {
  from: string;
  to: string;
}

const PRODUCT_COLORS: Record<string, ProductColor> = {
  pertalite: { from: "#22c55e", to: "#16a34a" },
  pertamax: { from: "#3b82f6", to: "#2563eb" },
  "pertamax turbo": { from: "#ef4444", to: "#dc2626" },
  "pertamax green 95": { from: "#10b981", to: "#059669" },
  biosolar: { from: "#f59e0b", to: "#d97706" },
  solar: { from: "#f59e0b", to: "#d97706" },
  dexlite: { from: "#6366f1", to: "#4f46e5" },
  "pertamina dex": { from: "#8b5cf6", to: "#7c3aed" },
  "bio solar": { from: "#14b8a6", to: "#0d9488" },
  "biosolar non subsidi": { from: "#14b8a6", to: "#0d9488" },
  "pertamax pertashop": { from: "#ec4899", to: "#db2777" },
};

export function getProductColor(productName: string): ProductColor {
  const key = productName.toLowerCase();
  return PRODUCT_COLORS[key] ?? { from: "#f97316", to: "#ea580c" };
}
