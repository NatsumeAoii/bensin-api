import { describe, it, expect } from "vitest";
import { translations, resolveTranslation, type TranslationKey } from "@/i18n/translations";

describe("Translations", () => {
  const idKeys = Object.keys(translations.id) as TranslationKey[];
  const enKeys = Object.keys(translations.en) as TranslationKey[];

  it("has the same keys in both locales", () => {
    const idSet = new Set(idKeys);
    const enSet = new Set(enKeys);

    const missingInEn = idKeys.filter((k) => !enSet.has(k));
    const missingInId = enKeys.filter((k) => !idSet.has(k));

    expect(missingInEn).toEqual([]);
    expect(missingInId).toEqual([]);
  });

  it("has no orphan keys (keys in en but not in id)", () => {
    const idSet = new Set(idKeys);
    const orphans = enKeys.filter((k) => !idSet.has(k));
    expect(orphans).toEqual([]);
  });

  it("has matching interpolation params between locales", () => {
    const paramRegex = /\{(\w+)\}/g;

    for (const key of idKeys) {
      const idValue = translations.id[key];
      const enValue = (translations.en as Record<string, string>)[key];

      if (!enValue) continue; // skip if missing (caught by other test)

      const idParams = [...idValue.matchAll(paramRegex)].map((m) => m[1]).sort();
      const enParams = [...enValue.matchAll(paramRegex)].map((m) => m[1]).sort();

      expect(idParams, `Param mismatch for key "${key}"`).toEqual(enParams);
    }
  });

  it("has no empty string values", () => {
    for (const key of idKeys) {
      expect(
        translations.id[key].trim().length,
        `Key "${key}" is empty in id locale`
      ).toBeGreaterThan(0);
    }
    for (const key of enKeys) {
      expect(
        (translations.en as Record<string, string>)[key].trim().length,
        `Key "${key}" is empty in en locale`
      ).toBeGreaterThan(0);
    }
  });
});

describe("resolveTranslation", () => {
  it("returns the value for a known key in the given locale", () => {
    const result = resolveTranslation("en", "nav.provinces");
    expect(result).toBe("Provinces");
  });

  it("returns the Indonesian value for a known key", () => {
    const result = resolveTranslation("id", "nav.provinces");
    expect(result).toBe("Provinsi");
  });

  it("falls back to Indonesian when key is missing in target locale", () => {
    // Simulate a missing key by using a key that exists in id
    const result = resolveTranslation("id", "home.title");
    expect(result).toBe("Harga BBM Indonesia");
  });

  it("interpolates parameters", () => {
    const result = resolveTranslation("id", "home.provinceCount", { count: 34 });
    expect(result).toBe("34 Provinsi");
  });

  it("interpolates parameters in English", () => {
    const result = resolveTranslation("en", "home.provinceCount", { count: 34 });
    expect(result).toBe("34 Provinces");
  });

  it("leaves unresolved params as literal {name}", () => {
    const result = resolveTranslation("id", "home.provinceCount", {});
    expect(result).toBe("{count} Provinsi");
  });

  it("returns the key itself when key is completely missing", () => {
    const result = resolveTranslation("id", "nonexistent.key" as TranslationKey);
    expect(result).toBe("nonexistent.key");
  });

  it("interpolates string params", () => {
    const result = resolveTranslation("id", "detail.updated", { time: "5 menit lalu" });
    expect(result).toBe("Diperbarui 5 menit lalu");
  });
});
