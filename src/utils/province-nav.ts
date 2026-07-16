import type { IndexProvinceEntry } from "@/types/api";

interface AdjacentSlugs {
  prev: IndexProvinceEntry | null;
  next: IndexProvinceEntry | null;
  index: number;
}

/**
 * Returns the previous and next province entries relative to the current slug
 * in an alphabetically sorted list (Indonesian locale).
 */
export function getAdjacentSlugs(
  provinces: IndexProvinceEntry[],
  currentSlug: string
): AdjacentSlugs {
  const sorted = [...provinces].sort((a, b) =>
    a.name.localeCompare(b.name, "id")
  );

  const index = sorted.findIndex((p) => p.slug === currentSlug);
  if (index === -1) {
    return { prev: null, next: null, index: -1 };
  }

  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
    index,
  };
}
