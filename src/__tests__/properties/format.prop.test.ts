import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatRupiah } from "@/utils/format";

/**
 * Property 8: Currency Formatter
 * Validates: Requirements 4.7
 *
 * For any non-negative integer n, formatRupiah(n) SHALL produce a string that:
 * (a) starts with the prefix "Rp "
 * (b) uses period (.) as the thousands grouping separator
 * (c) the numeric portion equals n when separators are removed and parsed back to integer
 */
describe("Feature: fuel-price-dashboard, Property 8: Currency Formatter", () => {
  it("formatRupiah produces valid Indonesian Rupiah format for any non-negative integer", () => {
    fc.assert(
      fc.property(fc.nat({ max: 1_000_000_000 }), (n) => {
        const result = formatRupiah(n);

        // (a) starts with the prefix "Rp "
        expect(result.startsWith("Rp ")).toBe(true);

        // Extract the numeric portion after "Rp "
        const numericPortion = result.slice(3);

        // (b) numeric portion uses only digits and periods (thousands separator)
        expect(numericPortion).toMatch(/^[\d.]+$/);

        // (c) removing periods and parsing back gives the original number
        const parsed = parseInt(numericPortion.replace(/\./g, ""), 10);
        expect(parsed).toBe(n);
      }),
      { numRuns: 100 }
    );
  });
});
