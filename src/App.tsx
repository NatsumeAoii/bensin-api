import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useThemeStore } from "@/stores/theme-store";
import { router } from "@/router";

/**
 * App root — initializes theme and renders the router.
 */
export default function App() {
  useEffect(() => {
    useThemeStore.getState().initTheme();
  }, []);

  return <RouterProvider router={router} />;
}
