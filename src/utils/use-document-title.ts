import { useEffect } from "react";

const BASE_TITLE = "BBM Indonesia";

/**
 * Sets the document title on mount and restores the base title on unmount.
 * Follows the pattern: "Page Name — BBM Indonesia"
 */
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    if (title) {
      document.title = `${title} — ${BASE_TITLE}`;
    } else {
      document.title = `Harga BBM Terkini — ${BASE_TITLE}`;
    }

    return () => {
      document.title = `Harga BBM Terkini — ${BASE_TITLE}`;
    };
  }, [title]);
}

/**
 * Maintains a single `<link rel="canonical">` in the document head pointing at
 * the current route's absolute URL. Without per-route canonicals, all 40+
 * province routes would share the index canonical, hurting SEO indexability.
 *
 * @param path - Route path beginning with "/" (e.g. "/nasional"). When null,
 *   any existing canonical link is left untouched.
 */
export function useCanonicalUrl(path: string | null): void {
  useEffect(() => {
    if (path === null || typeof document === "undefined") return;

    const href = `${window.location.origin}${path}`;
    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    const created = link === null;
    if (link === null) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const previous = link.href;
    link.href = href;

    return () => {
      // Remove a link we created; otherwise restore the prior value.
      if (created) {
        link?.remove();
      } else if (link) {
        link.href = previous;
      }
    };
  }, [path]);
}
