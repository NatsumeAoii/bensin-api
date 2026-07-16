import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useJsonLd,
  websiteSchema,
  datasetSchema,
  webPageSchema,
} from "@/utils/structured-data";

describe("useJsonLd", () => {
  afterEach(() => {
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
  });

  it("injects script tag on mount", () => {
    renderHook(() => useJsonLd(websiteSchema()));

    const scripts = document.head.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);
  });

  it("contains valid JSON", () => {
    renderHook(() => useJsonLd(websiteSchema()));

    const script = document.head.querySelector(
      'script[type="application/ld+json"]'
    );
    const parsed = JSON.parse(script!.textContent!);
    expect(parsed["@type"]).toBe("WebSite");
  });

  it("removes script on unmount", () => {
    const { unmount } = renderHook(() => useJsonLd(websiteSchema()));
    unmount();

    const scripts = document.head.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(0);
  });

  it("does nothing when schema is null", () => {
    renderHook(() => useJsonLd(null));

    const scripts = document.head.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(0);
  });
});

describe("schema generators", () => {
  it("websiteSchema returns correct type", () => {
    const schema = websiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("BBM Indonesia");
  });

  it("datasetSchema includes province name", () => {
    const schema = datasetSchema("Aceh");
    expect(schema["@type"]).toBe("Dataset");
    expect(schema.name).toContain("Aceh");
  });

  it("webPageSchema returns correct type", () => {
    const schema = webPageSchema("Test Page");
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.name).toBe("Test Page");
  });
});
