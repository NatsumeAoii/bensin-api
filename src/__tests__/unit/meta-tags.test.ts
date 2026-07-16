import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMetaTags } from "@/utils/meta-tags";

describe("useMetaTags", () => {
  afterEach(() => {
    // Clean up any leftover meta tags
    document
      .querySelectorAll('meta[property^="og:"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll('meta[name^="twitter:"]')
      .forEach((el) => el.remove());
  });

  it("sets OG tags on mount", () => {
    renderHook(() =>
      useMetaTags({ title: "Test Title", description: "Test desc" })
    );

    const ogTitle = document.head.querySelector('meta[property="og:title"]');
    expect(ogTitle).not.toBeNull();
    expect(ogTitle!.content).toContain("Test Title");

    const ogDesc = document.head.querySelector(
      'meta[property="og:description"]'
    );
    expect(ogDesc).not.toBeNull();
    expect(ogDesc!.content).toBe("Test desc");
  });

  it("sets Twitter Card tags", () => {
    renderHook(() => useMetaTags({ title: "Test" }));

    const twCard = document.head.querySelector('meta[name="twitter:card"]');
    expect(twCard).not.toBeNull();
    expect(twCard!.content).toBe("summary_large_image");
  });

  it("sets document title", () => {
    renderHook(() => useMetaTags({ title: "My Page" }));
    expect(document.title).toContain("My Page");
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useMetaTags({ title: "Temp" }));
    unmount();

    // Title should be restored
    expect(document.title).not.toContain("Temp");
  });

  it("sets og:url when provided", () => {
    renderHook(() =>
      useMetaTags({ title: "Test", url: "https://example.com" })
    );

    const ogUrl = document.head.querySelector('meta[property="og:url"]');
    expect(ogUrl).not.toBeNull();
    expect(ogUrl!.content).toBe("https://example.com");
  });
});
