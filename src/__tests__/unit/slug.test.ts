import { describe, it, expect } from "vitest";
import { isValidSlug } from "@/utils/slug";

describe("isValidSlug", () => {
  it("accepts simple lowercase alphanumeric slugs", () => {
    expect(isValidSlug("jakarta")).toBe(true);
    expect(isValidSlug("jawa-barat")).toBe(true);
    expect(isValidSlug("dki-jakarta")).toBe(true);
    expect(isValidSlug("nusa-tenggara-timur")).toBe(true);
  });

  it("accepts slugs with digits", () => {
    expect(isValidSlug("region1")).toBe(true);
    expect(isValidSlug("area-51")).toBe(true);
    expect(isValidSlug("123")).toBe(true);
  });

  it("rejects undefined", () => {
    expect(isValidSlug(undefined)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects slugs with uppercase letters", () => {
    expect(isValidSlug("Jakarta")).toBe(false);
    expect(isValidSlug("JAWA-BARAT")).toBe(false);
  });

  it("rejects slugs with leading or trailing hyphens", () => {
    expect(isValidSlug("-jakarta")).toBe(false);
    expect(isValidSlug("jakarta-")).toBe(false);
    expect(isValidSlug("-")).toBe(false);
  });

  it("rejects slugs with consecutive hyphens", () => {
    expect(isValidSlug("jawa--barat")).toBe(false);
  });

  it("rejects slugs with special characters", () => {
    expect(isValidSlug("jawa barat")).toBe(false);
    expect(isValidSlug("jawa_barat")).toBe(false);
    expect(isValidSlug("jawa/barat")).toBe(false);
    expect(isValidSlug("../etc/passwd")).toBe(false);
    expect(isValidSlug("<script>")).toBe(false);
  });

  it("rejects slugs exceeding 100 characters", () => {
    const longSlug = "a".repeat(101);
    expect(isValidSlug(longSlug)).toBe(false);
  });

  it("accepts slugs at exactly 100 characters", () => {
    const slug = "a".repeat(100);
    expect(isValidSlug(slug)).toBe(true);
  });
});
