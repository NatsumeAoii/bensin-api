import type { ZodType } from "zod";
import type {
  HistoryResponse,
  IndexResponse,
  NationalResponse,
  ProvinceResponse,
} from "../types/api";
import {
  historyResponseSchema,
  indexResponseSchema,
  nationalResponseSchema,
  provinceResponseSchema,
} from "../types/schemas";
import { isValidSlug } from "../utils/slug";

/**
 * Base URL for the static JSON API. Defaults to the production GitHub Pages
 * deployment but can be overridden via the `VITE_API_BASE_URL` env var so the
 * dashboard can be pointed at locally generated `v1/` data during development.
 */
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://nasgunawann.github.io/bensin-api";
const TIMEOUT_MS = 10_000;

type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "HTTP_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "INVALID_INPUT";

interface FetchOptions {
  signal?: AbortSignal;
}

/**
 * Typed error class for API failures.
 * Classifies errors into network, timeout, HTTP, parse, validation, and
 * invalid-input categories for targeted error handling and user-facing
 * messages.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetches JSON from the API with a 10-second timeout via AbortController and
 * validates the parsed payload against a Zod schema before returning it.
 * Classifies all failure modes into typed ApiError instances.
 *
 * When a caller-provided signal is given, both the caller's signal and the
 * internal timeout signal are combined — whichever fires first aborts the
 * request. If the caller's signal is already aborted, the request is rejected
 * immediately.
 */
async function fetchJson<T>(
  path: string,
  schema: ZodType<T>,
  options?: FetchOptions
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // If a caller signal is provided, forward its abort to our controller
  // so both timeout and external cancellation are respected.
  const callerSignal = options?.signal;
  let onCallerAbort: (() => void) | undefined;

  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError("Koneksi terlalu lama", "TIMEOUT");
    }
    onCallerAbort = () => controller.abort();
    callerSignal.addEventListener("abort", onCallerAbort);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Gagal memuat data", "PARSE_ERROR");
    }

    // Validate the payload shape at the boundary before the app trusts it.
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError("Format data tidak valid", "VALIDATION_ERROR");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      // Distinguish between caller-initiated abort and timeout
      if (callerSignal?.aborted) {
        throw new ApiError("Permintaan dibatalkan", "TIMEOUT");
      }
      throw new ApiError("Koneksi terlalu lama", "TIMEOUT");
    }
    throw new ApiError("Gagal memuat data", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal && onCallerAbort) {
      callerSignal.removeEventListener("abort", onCallerAbort);
    }
  }
}

/**
 * Guards slug-based endpoints at the client boundary so a malformed slug
 * becomes a clean typed rejection instead of an errant network request.
 * Returns a rejected promise (never throws synchronously) so every call site
 * can rely on `.catch`/`await` regardless of how it consumes the client.
 */
function fetchBySlug<T>(
  slug: string,
  buildPath: (slug: string) => string,
  schema: ZodType<T>
): Promise<T> {
  if (!isValidSlug(slug)) {
    return Promise.reject(
      new ApiError("Slug provinsi tidak valid", "INVALID_INPUT")
    );
  }
  return fetchJson<T>(buildPath(slug), schema);
}

export const apiClient = {
  getIndex: () =>
    fetchJson<IndexResponse>("/v1/index.json", indexResponseSchema),
  getProvince: (slug: string) =>
    fetchBySlug<ProvinceResponse>(
      slug,
      (s) => `/v1/provinsi/${s}.json`,
      provinceResponseSchema
    ),
  getNational: () =>
    fetchJson<NationalResponse>("/v1/nasional.json", nationalResponseSchema),
  getHistory: (slug: string) =>
    fetchBySlug<HistoryResponse>(
      slug,
      (s) => `/v1/history/provinsi/${s}.json`,
      historyResponseSchema
    ),
};
