/**
 * Runtime validation schemas for the Bensin-API JSON responses.
 *
 * These mirror the static TypeScript interfaces in `./api.ts` but enforce the
 * shape at runtime, at the network boundary, so a malformed or hijacked
 * upstream payload surfaces as a typed validation failure instead of an
 * undefined-access crash deep in the render tree.
 *
 * Each schema is annotated with its canonical `./api.ts` type. That annotation
 * is a compile-time guard: if the hand-written interface and the runtime schema
 * drift apart, `tsc` fails here rather than silently at runtime.
 */
import { z } from "zod";
import type {
  HistoryResponse,
  IndexResponse,
  NationalResponse,
  Product,
  ProvinceResponse,
} from "./api";

export const availabilitySchema = z.enum([
  "available",
  "unavailable",
  "unknown",
]);

export const productSchema: z.ZodType<Product> = z.object({
  product: z.string(),
  price_rupiah: z.number().nullable(),
  availability: availabilitySchema,
});

export const indexResponseSchema: z.ZodType<IndexResponse> = z.object({
  api_name: z.string(),
  version: z.string(),
  author: z.string(),
  github_repository: z.string(),
  synced_at: z.string(),
  pertamina_updated_at: z.string(),
  provinsi_count: z.number(),
  provinsi: z.record(
    z.string(),
    z.object({
      name: z.string(),
      slug: z.string(),
      path: z.string(),
      pertamina_updated_at: z.string(),
      synced_at: z.string(),
      products_count: z.number(),
      file_size_bytes: z.number(),
    })
  ),
  endpoints: z.record(z.string(), z.string()),
});

export const provinceResponseSchema: z.ZodType<ProvinceResponse> = z.object({
  province: z.string(),
  province_slug: z.string(),
  pertamina_updated_at: z.string(),
  synced_at: z.string(),
  products: z.array(productSchema),
});

export const nationalResponseSchema: z.ZodType<NationalResponse> = z.object({
  version: z.string(),
  synced_at: z.string(),
  pertamina_updated_at: z.string(),
  provinces: z.array(provinceResponseSchema),
});

export const historyResponseSchema: z.ZodType<HistoryResponse> = z.object({
  province: z.string(),
  province_slug: z.string(),
  products: z.record(
    z.string(),
    z.array(
      z.object({
        date: z.string(),
        price_rupiah: z.number(),
      })
    )
  ),
});
