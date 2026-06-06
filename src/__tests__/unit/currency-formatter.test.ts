import { describe, it, expect } from "vitest";
import { formatRupiah, formatPrice } from "@/utils/format";

describe("formatRupiah", () => {
  it("formats zero as 'Rp 0'", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("formats small numbers without separator", () => {
    expect(formatRupiah(500)).toBe("Rp 500");
  });

  it("formats thousands with period separator", () => {
    expect(formatRupiah(12600)).toBe("Rp 12.600");
  });

  it("formats large numbers with multiple separators", () => {
    expect(formatRupiah(1000000)).toBe("Rp 1.000.000");
  });

  it("starts with 'Rp ' prefix", () => {
    const result = formatRupiah(9999);
    expect(result.startsWith("Rp ")).toBe(true);
  });
});

describe("formatPrice", () => {
  it("returns 'Tidak Tersedia' for null", () => {
    expect(formatPrice(null)).toBe("Tidak Tersedia");
  });

  it("delegates to formatRupiah for numbers", () => {
    expect(formatPrice(12600)).toBe("Rp 12.600");
  });

  it("handles zero price", () => {
    expect(formatPrice(0)).toBe("Rp 0");
  });
});
