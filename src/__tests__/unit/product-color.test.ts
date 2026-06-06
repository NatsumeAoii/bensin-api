import { describe, it, expect } from "vitest";
import { getProductColor } from "@/utils/products";

const BRAND_DEFAULT = { from: "#f97316", to: "#ea580c" };

describe("getProductColor", () => {
  it("returns a distinct color for known products", () => {
    const pertalite = getProductColor("PERTALITE");
    const pertamax = getProductColor("PERTAMAX");

    expect(pertalite).not.toEqual(BRAND_DEFAULT);
    expect(pertamax).not.toEqual(BRAND_DEFAULT);
    expect(pertalite).not.toEqual(pertamax);
  });

  it("is case-insensitive (API returns uppercase names)", () => {
    expect(getProductColor("PERTALITE")).toEqual(getProductColor("pertalite"));
    expect(getProductColor("Pertamax Turbo")).toEqual(
      getProductColor("PERTAMAX TURBO")
    );
  });

  it("maps the canonical BIOSOLAR name to a defined color", () => {
    expect(getProductColor("BIOSOLAR")).not.toEqual(BRAND_DEFAULT);
  });

  it("maps PERTAMAX GREEN 95 to a defined color", () => {
    expect(getProductColor("PERTAMAX GREEN 95")).not.toEqual(BRAND_DEFAULT);
  });

  it("maps PERTAMAX PERTASHOP to a defined color", () => {
    expect(getProductColor("PERTAMAX PERTASHOP")).not.toEqual(BRAND_DEFAULT);
  });

  it("falls back to the brand color for unknown products", () => {
    expect(getProductColor("UNKNOWN FUEL XYZ")).toEqual(BRAND_DEFAULT);
    expect(getProductColor("")).toEqual(BRAND_DEFAULT);
  });

  it("returns objects with from and to hex strings", () => {
    const color = getProductColor("DEXLITE");
    expect(color.from).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color.to).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
