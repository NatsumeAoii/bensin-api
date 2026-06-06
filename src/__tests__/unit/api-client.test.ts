import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "../../api/client";

describe("API Client", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("ApiError class", () => {
    it("creates error with NETWORK_ERROR code", () => {
      const error = new ApiError("Gagal memuat data", "NETWORK_ERROR");
      expect(error.message).toBe("Gagal memuat data");
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.status).toBeUndefined();
      expect(error.name).toBe("ApiError");
      expect(error).toBeInstanceOf(Error);
    });

    it("creates error with HTTP_ERROR code and status", () => {
      const error = new ApiError("HTTP 404", "HTTP_ERROR", 404);
      expect(error.message).toBe("HTTP 404");
      expect(error.code).toBe("HTTP_ERROR");
      expect(error.status).toBe(404);
    });

    it("creates error with TIMEOUT code", () => {
      const error = new ApiError("Koneksi terlalu lama", "TIMEOUT");
      expect(error.code).toBe("TIMEOUT");
    });

    it("creates error with PARSE_ERROR code", () => {
      const error = new ApiError("Gagal memuat data", "PARSE_ERROR");
      expect(error.code).toBe("PARSE_ERROR");
    });
  });

  describe("fetchJson via apiClient methods", () => {
    it("getIndex fetches from correct URL", async () => {
      const mockData = { api_name: "bensin-api", provinsi: {} };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

      const result = await apiClient.getIndex();

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://nasgunawann.github.io/bensin-api/v1/index.json",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(result).toEqual(mockData);
    });

    it("getProvince fetches from correct URL with slug", async () => {
      const mockData = { province: "DKI Jakarta", products: [] };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

      const result = await apiClient.getProvince("dki-jakarta");

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://nasgunawann.github.io/bensin-api/v1/provinsi/dki-jakarta.json",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(result).toEqual(mockData);
    });

    it("getNational fetches from correct URL", async () => {
      const mockData = { version: "1.0", provinces: [] };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

      const result = await apiClient.getNational();

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://nasgunawann.github.io/bensin-api/v1/nasional.json",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(result).toEqual(mockData);
    });

    it("throws HTTP_ERROR for non-200 response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Not Found", { status: 404 })
      );

      await expect(apiClient.getProvince("invalid-slug")).rejects.toThrow(ApiError);
      await expect(apiClient.getProvince("invalid-slug")).rejects.toMatchObject({
        code: "HTTP_ERROR",
        status: 404,
        message: "HTTP 404",
      });
    });

    it("throws PARSE_ERROR when response is not valid JSON", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("not json content", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      );

      await expect(apiClient.getIndex()).rejects.toThrow(ApiError);
      await expect(apiClient.getIndex()).rejects.toMatchObject({
        code: "PARSE_ERROR",
        message: "Gagal memuat data",
      });
    });

    it("throws NETWORK_ERROR when fetch fails with TypeError", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new TypeError("Failed to fetch")
      );

      await expect(apiClient.getIndex()).rejects.toThrow(ApiError);
      await expect(apiClient.getIndex()).rejects.toMatchObject({
        code: "NETWORK_ERROR",
        message: "Gagal memuat data",
      });
    });

    it("throws TIMEOUT when request is aborted", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new DOMException("The operation was aborted.", "AbortError")
      );

      await expect(apiClient.getIndex()).rejects.toMatchObject({
        code: "TIMEOUT",
        message: "Koneksi terlalu lama",
      });
    });

    it("clears timeout after successful response", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ data: "test" }), { status: 200 })
      );

      await apiClient.getIndex();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("clears timeout after failed response", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("", { status: 500 })
      );

      await expect(apiClient.getIndex()).rejects.toThrow();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
