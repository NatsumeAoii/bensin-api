import { Outlet, NavLink } from "react-router";
import { Fuel, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

/**
 * App shell layout — sticky header with nav, main content via Outlet,
 * footer, and mobile bottom nav. Uses React Router's NavLink for
 * SPA navigation without full page reloads.
 */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Skip to main content — first focusable element for keyboard/SR users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-orange-700 focus:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:focus:bg-stone-800 dark:focus:text-orange-400"
      >
        Lewati ke konten utama
      </a>

      {/* Header */}
      <header className="sticky top-0 z-100 border-b border-stone-200/60 bg-white/80 backdrop-blur-xl dark:border-stone-800/60 dark:bg-stone-950/80">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          {/* Logo + Desktop nav */}
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="group inline-flex min-h-[44px] min-w-[44px] items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:hover:bg-stone-800"
              aria-label="Beranda - Harga BBM Indonesia"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-sm shadow-orange-500/20">
                <Fuel size={16} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-bold tracking-tight text-stone-900 dark:text-white">
                BBM<span className="text-gradient">.id</span>
              </span>
            </NavLink>

            <ul className="hidden items-center gap-1 sm:flex" role="list">
              <li>
                <NavLink
                  to="/"
                  end
                  className={desktopNavClass}
                  aria-label="Daftar Provinsi"
                >
                  {({ isActive }) => (
                    <span
                      className="inline-flex items-center gap-2"
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Fuel size={16} aria-hidden="true" />
                      Provinsi
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nasional"
                  className={desktopNavClass}
                  aria-label="Perbandingan Nasional"
                >
                  {({ isActive }) => (
                    <span
                      className="inline-flex items-center gap-2"
                      aria-current={isActive ? "page" : undefined}
                    >
                      <BarChart3 size={16} aria-hidden="true" />
                      Nasional
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </nav>
      </header>

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm sm:px-6 sm:py-8 sm:text-base animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navigasi mobile"
        className="fixed inset-x-0 bottom-0 z-100 border-t border-stone-200/80 bg-white/90 backdrop-blur-xl sm:hidden dark:border-stone-800/80 dark:bg-stone-950/90"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
          <NavLink
            to="/"
            end
            className={mobileNavClass}
            aria-label="Daftar Provinsi"
          >
            {({ isActive }) => (
              <span
                className="flex flex-col items-center gap-0.5"
                aria-current={isActive ? "page" : undefined}
              >
                <Fuel size={20} aria-hidden="true" />
                <span className="text-[10px] font-semibold">Provinsi</span>
              </span>
            )}
          </NavLink>
          <NavLink
            to="/nasional"
            className={mobileNavClass}
            aria-label="Perbandingan Nasional"
          >
            {({ isActive }) => (
              <span
                className="flex flex-col items-center gap-0.5"
                aria-current={isActive ? "page" : undefined}
              >
                <BarChart3 size={20} aria-hidden="true" />
                <span className="text-[10px] font-semibold">Nasional</span>
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Bottom padding spacer for mobile nav */}
      <div className="h-16 sm:hidden" aria-hidden="true" />
    </div>
  );
}

/**
 * Active-aware className for desktop nav items.
 */
function desktopNavClass({ isActive }: { isActive: boolean }): string {
  const base =
    "inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";
  const active =
    "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
  const inactive =
    "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white";
  return `${base} ${isActive ? active : inactive}`;
}

/**
 * Active-aware className for mobile bottom nav items.
 */
function mobileNavClass({ isActive }: { isActive: boolean }): string {
  const base =
    "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";
  const active = "text-orange-600 dark:text-orange-400";
  const inactive = "text-stone-500 dark:text-stone-400";
  return `${base} ${isActive ? active : inactive}`;
}
