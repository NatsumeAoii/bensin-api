/**
 * TypeScript types matching the Bensin-API JSON response structures.
 * Source: generated static JSON under /v1/.
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
  endpoints: Record<string, string>;
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

export interface HistoryPoint {
  date: string;
  price_rupiah: number;
}

export interface HistoryResponse {
  province: string;
  province_slug: string;
  products: Record<string, HistoryPoint[]>;
}

export interface HistoryIndexEntry {
  slug: string;
  name: string;
  path: string;
  point_count: number;
}

export interface HistoryIndexResponse {
  count: number;
  synced_at: string;
  provinsi: HistoryIndexEntry[];
}

export interface PriceChangeEvent {
  date: string;
  province: string;
  province_slug: string;
  product: string;
  old_price: number;
  new_price: number;
  change_absolute: number;
  change_percent: number;
}
