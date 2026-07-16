import { useEffect } from "react";

/**
 * Injects a `<script type="application/ld+json">` tag on mount and removes it on unmount.
 */
export function useJsonLd(schema: Record<string, unknown> | null): void {
  useEffect(() => {
    if (!schema) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [schema]);
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BBM Indonesia",
    url: "https://nasgunawann.github.io/bensin-api/",
    description: "Harga BBM Indonesia terkini dari Pertamina",
    inLanguage: ["id", "en"],
  };
}

export function datasetSchema(provinceName: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Harga BBM ${provinceName}`,
    description: `Data harga BBM di ${provinceName} dari Pertamina`,
    url: `https://nasgunawann.github.io/bensin-api/`,
    inLanguage: "id",
    publisher: {
      "@type": "Organization",
      name: "BBM Indonesia",
    },
  };
}

export function webPageSchema(title: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: window.location.href,
    inLanguage: ["id", "en"],
  };
}
