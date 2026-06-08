import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryDynamicImport } from "@/utils/retry-import";

describe("retryDynamicImport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the module on first success without retrying", async () => {
    const mod = { default: "page" };
    const importFn = vi.fn().mockResolvedValue(mod);

    const result = await retryDynamicImport(importFn);

    expect(result).toBe(mod);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("retries once after the delay when the first import fails", async () => {
    const mod = { default: "page" };
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("chunk load failed"))
      .mockResolvedValueOnce(mod);

    const promise = retryDynamicImport(importFn, 1000);
    // Let the initial rejection settle, then advance past the retry delay.
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe(mod);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it("rejects when the retry also fails", async () => {
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("second"));

    const promise = retryDynamicImport(importFn, 500);
    // Attach the rejection expectation before advancing timers so the inner
    // rejection is always observed (no unhandled-rejection warning).
    const assertion = expect(promise).rejects.toThrow("second");
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(importFn).toHaveBeenCalledTimes(2);
  });
});
