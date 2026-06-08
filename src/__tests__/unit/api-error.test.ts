import { describe, it, expect } from "vitest";
import { ApiError } from "@/api/client";
import { isTransientError } from "@/utils/api-error";

describe("isTransientError", () => {
  it("treats network errors as transient", () => {
    expect(isTransientError(new ApiError("x", "NETWORK_ERROR"))).toBe(true);
  });

  it("treats timeouts as transient", () => {
    expect(isTransientError(new ApiError("x", "TIMEOUT"))).toBe(true);
  });

  it("treats 5xx HTTP errors as transient", () => {
    expect(isTransientError(new ApiError("x", "HTTP_ERROR", 500))).toBe(true);
    expect(isTransientError(new ApiError("x", "HTTP_ERROR", 503))).toBe(true);
  });

  it("treats 4xx HTTP errors as permanent", () => {
    expect(isTransientError(new ApiError("x", "HTTP_ERROR", 404))).toBe(false);
    expect(isTransientError(new ApiError("x", "HTTP_ERROR", 403))).toBe(false);
  });

  it("treats HTTP errors without a status as permanent", () => {
    expect(isTransientError(new ApiError("x", "HTTP_ERROR"))).toBe(false);
  });

  it("treats validation, parse, and invalid-input errors as permanent", () => {
    expect(isTransientError(new ApiError("x", "VALIDATION_ERROR"))).toBe(false);
    expect(isTransientError(new ApiError("x", "PARSE_ERROR"))).toBe(false);
    expect(isTransientError(new ApiError("x", "INVALID_INPUT"))).toBe(false);
  });
});
