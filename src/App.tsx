import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useThemeStore } from "@/stores/theme-store";
import { useLocaleStore } from "@/stores/locale-store";
import { router } from "@/router";

/**
 * App root — initializes theme and locale, then renders the router.
 */
export default function App() {
  useEffect(() => {
    useThemeStore.getState().initTheme();
    useLocaleStore.getState().initLocale();
  }, []);

  return <RouterProvider router={router} />;
}
