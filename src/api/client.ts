import type { IndexResponse, NationalResponse, ProvinceResponse } from "../types/api";

const BASE_URL = "https://nasgunawann.github.io/bensin-api";
const TIMEOUT_MS = 10_000;

type ApiErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "HTTP_ERROR" | "PARSE_ERROR";

interface FetchOptions {
  signal?: AbortSignal;
}

/**
 * Typed error class for API failures.
 * Classifies errors into network, timeout, HTTP, and parse categories
 * for targeted error handling and user-facing messages.
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
 * Fetches JSON from the API with a 10-second timeout via AbortController.
 * Classifies all failure modes into typed ApiError instances.
 *
 * When a caller-provided signal is given, both the caller's signal and the
 * internal timeout signal are combined — whichever fires first aborts the
 * request. If the caller's signal is already aborted, the request is rejected
 * immediately.
 */
async function fetchJson<T>(path: string, options?: FetchOptions): Promise<T> {
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

    try {
      const data: unknown = await response.json();
      return data as T;
    } catch {
      throw new ApiError("Gagal memuat data", "PARSE_ERROR");
    }
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

export const apiClient = {
  getIndex: () => fetchJson<IndexResponse>("/v1/index.json"),
  getProvince: (slug: string) =>
    fetchJson<ProvinceResponse>(`/v1/provinsi/${slug}.json`),
  getNational: () => fetchJson<NationalResponse>("/v1/nasional.json"),
};
