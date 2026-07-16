import type { ProvinceResponse } from "@/types/api";

export interface Region {
  name: string;
  slugs: string[];
}

export const REGION_MAP: Record<string, Region> = {
  sumatera: {
    name: "Sumatera",
    slugs: [
      "aceh",
      "sumatera-utara",
      "sumatera-barat",
      "riau",
      "jambi",
      "sumatera-selatan",
      "bengkulu",
      "lampung",
      "kepulauan-bangka-belitung",
      "kepulauan-riau",
    ],
  },
  jawa: {
    name: "Jawa",
    slugs: [
      "dki-jakarta",
      "jawa-barat",
      "jawa-tengah",
      "di-yogyakarta",
      "jawa-timur",
      "banten",
    ],
  },
  kalimantan: {
    name: "Kalimantan",
    slugs: [
      "kalimantan-barat",
      "kalimantan-tengah",
      "kalimantan-selatan",
      "kalimantan-timur",
      "kalimantan-utara",
    ],
  },
  sulawesi: {
    name: "Sulawesi",
    slugs: [
      "sulawesi-utara",
      "sulawesi-tengah",
      "sulawesi-selatan",
      "sulawesi-tenggara",
      "gorontalo",
      "sulawesi-barat",
    ],
  },
  bali_nt: {
    name: "Bali & Nusa Tenggara",
    slugs: ["bali", "nusa-tenggara-barat", "nusa-tenggara-timur"],
  },
  maluku: {
    name: "Maluku",
    slugs: ["maluku", "maluku-utara"],
  },
  papua: {
    name: "Papua",
    slugs: [
      "papua",
      "papua-barat",
      "papua-tengah",
      "papua-pegunungan",
      "papua-selatan",
      "papua-barat-daya",
    ],
  },
};

const slugToRegion = new Map<string, string>();
for (const [regionKey, region] of Object.entries(REGION_MAP)) {
  for (const slug of region.slugs) {
    slugToRegion.set(slug, regionKey);
  }
}

export function getRegion(slug: string): string | null {
  return slugToRegion.get(slug) ?? null;
}

export function groupByRegion(
  provinces: ProvinceResponse[]
): Map<string, ProvinceResponse[]> {
  const groups = new Map<string, ProvinceResponse[]>();
  for (const province of provinces) {
    const regionKey = getRegion(province.province_slug);
    if (!regionKey) continue;
    const list = groups.get(regionKey) ?? [];
    list.push(province);
    groups.set(regionKey, list);
  }
  return groups;
}
