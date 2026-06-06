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
