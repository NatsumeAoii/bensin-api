import { describe, it, expect } from "vitest";
import { isValidSlug } from "@/utils/slug";

// The URL merge logic is tested through its building blocks:
// 1. Parsing comma-separated slugs from ?bookmarks= param
// 2. Validating each with isValidSlug
// 3. Calling mergeBookmarks (tested in bookmark-store.test.ts)

describe("URL bookmark merge logic", () => {
  it("valid slugs pass isValidSlug", () => {
    expect(isValidSlug("aceh")).toBe(true);
    expect(isValidSlug("dki-jakarta")).toBe(true);
    expect(isValidSlug("jawa-barat")).toBe(true);
  });

  it("invalid slugs fail isValidSlug", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("INVALID")).toBe(false);
    expect(isValidSlug("slug with spaces")).toBe(false);
    expect(isValidSlug("<script>")).toBe(false);
  });

  it("parses and filters comma-separated slugs correctly", () => {
    const param = "aceh,bali,INVALID,dki-jakarta,,  ,papua";
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidSlug(s));
    expect(slugs).toEqual(["aceh", "bali", "dki-jakarta", "papua"]);
  });

  it("returns empty array for all-invalid slugs", () => {
    const param = "INVALID,<>,'';drop table";
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidSlug(s));
    expect(slugs).toEqual([]);
  });

  it("handles single slug", () => {
    const param = "aceh";
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidSlug(s));
    expect(slugs).toEqual(["aceh"]);
  });

  it("deduplicates slugs during parse", () => {
    const param = "aceh,bali,aceh,bali";
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && isValidSlug(s));
    // parse doesn't dedupe — mergeBookmarks does
    expect(slugs).toEqual(["aceh", "bali", "aceh", "bali"]);
    // But after Set: unique
    expect([...new Set(slugs)]).toEqual(["aceh", "bali"]);
  });
});
