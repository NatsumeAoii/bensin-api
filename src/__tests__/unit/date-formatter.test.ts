import { describe, it, expect } from "vitest";
import { formatSyncTime } from "@/utils/date";

describe("formatSyncTime", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  describe("relative time (< 7 days)", () => {
    it("formats seconds ago", () => {
      const timestamp = new Date("2026-06-15T11:59:30Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/30 detik/);
    });

    it("formats minutes ago", () => {
      const timestamp = new Date("2026-06-15T11:45:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/15 menit/);
    });

    it("formats hours ago", () => {
      const timestamp = new Date("2026-06-15T10:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/2 jam/);
    });

    it("formats days ago", () => {
      const timestamp = new Date("2026-06-13T12:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/2 hari/);
    });

    it("formats 6 days ago as relative time", () => {
      const timestamp = new Date("2026-06-09T12:00:01Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/hari/);
    });

    it("formats 0 seconds difference", () => {
      const result = formatSyncTime(now.toISOString(), now);
      expect(result).toMatch(/detik/);
    });
  });

  describe("absolute date (>= 7 days)", () => {
    it("formats exactly 7 days old as absolute", () => {
      const timestamp = new Date("2026-06-08T12:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).not.toMatch(/hari|jam|menit|detik/);
      expect(result).toMatch(/\d+/);
      expect(result).toMatch(/2026/);
    });

    it("formats old timestamps as absolute date", () => {
      const timestamp = new Date("2026-01-15T10:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2026/);
    });

    it("formats timestamps from a different year", () => {
      const timestamp = new Date("2025-03-20T08:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, now);
      expect(result).toMatch(/20/);
      expect(result).toMatch(/Mar/);
      expect(result).toMatch(/2025/);
    });
  });

  describe("edge cases", () => {
    it("uses the now parameter for testability", () => {
      const customNow = new Date("2030-01-01T00:00:00Z");
      const timestamp = new Date("2029-12-31T23:00:00Z").toISOString();
      const result = formatSyncTime(timestamp, customNow);
      expect(result).toMatch(/1 jam/);
    });

    it("handles boundary at exactly 7 days minus 1ms as relative", () => {
      // 6 days, 23 hours, 59 minutes, 59 seconds, 999ms before now
      const sevenDaysMinusOneMs = 7 * 24 * 60 * 60 * 1000 - 1;
      const timestamp = new Date(
        now.getTime() - sevenDaysMinusOneMs
      ).toISOString();
      const result = formatSyncTime(timestamp, now);
      // Should still be relative since it's under 7 days
      expect(result).toMatch(/hari/);
    });
  });
});
