import { useEffect } from "react";

const BASE_TITLE = "BBM Indonesia";
const BASE_DESCRIPTION =
  "Harga BBM Indonesia terkini dari Pertamina. Data 40 provinsi, 9 produk, diperbarui otomatis setiap jam.";

interface MetaTagOptions {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

function setMeta(property: string, content: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
  return el;
}

function setNameMeta(name: string, content: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.content = content;
  return el;
}

/**
 * Sets OG, Twitter Card, and document title meta tags.
 * Cleans up on unmount by restoring base values.
 */
export function useMetaTags(options: MetaTagOptions): void {
  const {
    title,
    description = BASE_DESCRIPTION,
    url,
    image,
    type = "website",
  } = options;

  useEffect(() => {
    const fullTitle = title
      ? `${title} — ${BASE_TITLE}`
      : `${BASE_TITLE} — Harga BBM Terkini`;
    const prevTitle = document.title;
    document.title = fullTitle;

    const ogTitle = setMeta("og:title", fullTitle);
    const ogDesc = setMeta("og:description", description);
    const ogType = setMeta("og:type", type);
    const twCard = setNameMeta("twitter:card", "summary_large_image");
    const twTitle = setNameMeta("twitter:title", fullTitle);
    const twDesc = setNameMeta("twitter:description", description);

    const ogUrl = url ? setMeta("og:url", url) : null;
    const ogImage = image ? setMeta("og:image", image) : null;
    const twImage = image ? setNameMeta("twitter:image", image) : null;

    return () => {
      document.title = prevTitle;
      ogTitle.content = BASE_TITLE;
      ogDesc.content = BASE_DESCRIPTION;
      ogType.content = "website";
      twCard.content = "summary_large_image";
      twTitle.content = BASE_TITLE;
      twDesc.content = BASE_DESCRIPTION;
      if (ogUrl) ogUrl.remove();
      if (ogImage) ogImage.remove();
      if (twImage) twImage.remove();
    };
  }, [title, description, url, image, type]);
}
