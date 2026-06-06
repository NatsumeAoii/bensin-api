import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isValidSlug } from "@/utils/slug";

/**
 * Feature: architecture-improvements, Property 6: Slug validation correctness
 *
 * Validates: Requirements 3.1
 *
 * For any string `s`, `isValidSlug(s)` SHALL return `true` if and only if
 * `s` matches the regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` AND `s.length <= 100`.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;

function expectedResult(s: string): boolean {
  return s.length > 0 && s.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(s);
}

describe("Feature: architecture-improvements, Property 6: Slug validation correctness", () => {
  it("isValidSlug(s) agrees with regex + length check for arbitrary strings", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(isValidSlug(s)).toBe(expectedResult(s));
      }),
      { numRuns: 1000 }
    );
  });

  it("isValidSlug(s) returns true for known valid slugs", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "jakarta",
          "jawa-barat",
          "dki-jakarta",
          "nusa-tenggara-timur",
          "region1",
          "area-51",
          "a",
          "abc-def-ghi",
          "a1b2c3",
          "hello-world-123"
        ),
        (s) => {
          expect(isValidSlug(s)).toBe(true);
          expect(expectedResult(s)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isValidSlug(s) returns false for known invalid slugs", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "",
          "-leading",
          "trailing-",
          "double--hyphen",
          "UPPERCASE",
          "with space",
          "under_score",
          "../etc/passwd",
          "<script>alert(1)</script>",
          "a".repeat(101)
        ),
        (s) => {
          expect(isValidSlug(s)).toBe(false);
          expect(expectedResult(s)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isValidSlug(s) returns true for generated valid slugs", () => {
    const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

    const segmentArb = fc
      .array(fc.constantFrom(...SLUG_CHARS.split("")), {
        minLength: 1,
        maxLength: 10,
      })
      .map((chars) => chars.join(""));

    const validSlugArb = fc
      .array(segmentArb, { minLength: 1, maxLength: 8 })
      .map((segments) => segments.join("-"))
      .filter((slug) => slug.length <= MAX_SLUG_LENGTH);

    fc.assert(
      fc.property(validSlugArb, (slug) => {
        expect(isValidSlug(slug)).toBe(true);
      }),
      { numRuns: 500 }
    );
  });

  it("isValidSlug returns false for strings exceeding 100 characters", () => {
    const longStringArb = fc.string({ minLength: 101, maxLength: 300 });

    fc.assert(
      fc.property(longStringArb, (s) => {
        expect(isValidSlug(s)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
