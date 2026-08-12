import { ApiError } from "@/api/client";
import type { TranslationKey } from "@/i18n/translations";

export function getApiErrorMessageKey(error: ApiError): TranslationKey {
  switch (error.code) {
    case "TIMEOUT":
      return "error.timeout";
    case "NETWORK_ERROR":
      return "error.network";
    case "PARSE_ERROR":
    case "VALIDATION_ERROR":
      return "error.invalidData";
    case "INVALID_INPUT":
      return "error.invalidInput";
    case "HTTP_ERROR":
      return error.status === 404 ? "error.notFound" : "error.loadFailed";
  }
}

/**
 * Classifies an ApiError as transient (worth retrying) or permanent.
 *
 * Transient: network blips, timeouts, and server-side 5xx responses — a retry
 * may succeed. Permanent: validation failures, invalid input, and non-404 4xx
 * client errors — retrying will not help, so the UI should not offer a retry.
 *
 * 404 is intentionally treated as permanent here; callers that render a 404 as
 * an "empty" state (e.g. history not yet generated) handle it before reaching
 * this classifier.
 */
export function isTransientError(error: ApiError): boolean {
  switch (error.code) {
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return true;
    case "HTTP_ERROR":
      return error.status !== undefined && error.status >= 500;
    case "VALIDATION_ERROR":
    case "PARSE_ERROR":
    case "INVALID_INPUT":
      return false;
    default:
      return false;
  }
}
