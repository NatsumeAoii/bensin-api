import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Scrolls to the top of the page on every route change.
 * Must be rendered inside a RouterProvider context (e.g. as a child of a layout route).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
