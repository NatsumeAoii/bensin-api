/**
 * TypeScript types matching the Bensin-API JSON response structures.
 * Source: https://nasgunawann.github.io/bensin-api/v1/
 */

export interface IndexProvinceEntry {
  name: string;
  slug: string;
  path: string;
  pertamina_updated_at: string;
  synced_at: string;
  products_count: number;
  file_size_bytes: number;
}

export interface IndexResponse {
  api_name: string;
  version: string;
  author: string;
  github_repository: string;
  synced_at: string;
  pertamina_updated_at: string;
  provinsi_count: number;
  provinsi: Record<string, IndexProvinceEntry>;
  endpoints: { all_provinces: string };
}

export type Availability = "available" | "unavailable" | "unknown";

export interface Product {
  product: string;
  price_rupiah: number | null;
  availability: Availability;
}

export interface ProvinceResponse {
  province: string;
  province_slug: string;
  pertamina_updated_at: string;
  synced_at: string;
  products: Product[];
}

export interface NationalResponse {
  version: string;
  synced_at: string;
  pertamina_updated_at: string;
  provinces: ProvinceResponse[];
}
