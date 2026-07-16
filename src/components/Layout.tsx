import { Outlet, NavLink } from "react-router";
import { Fuel, BarChart3, History } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";
import { DesktopOverflowMenu, OverflowMenu } from "@/components/OverflowMenu";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/i18n";
import type { TranslationKey } from "@/i18n";

interface NavItem {
  to: string;
  label: TranslationKey;
  icon: LucideIcon;
  end?: boolean;
}

const primaryNav: NavItem[] = [
  { to: "/", label: "nav.provinces", icon: Fuel, end: true },
  { to: "/nasional", label: "nav.national", icon: BarChart3 },
  { to: "/perubahan", label: "nav.changes", icon: History },
];

const secondaryNav: NavItem[] = [];

/**
 * App shell layout — sticky header with nav, main content via Outlet,
 * footer, and mobile bottom nav. Uses React Router's NavLink for
 * SPA navigation without full page reloads.
 */
export function Layout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Skip to main content — first focusable element for keyboard/SR users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-orange-700 focus:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:focus:bg-stone-800 dark:focus:text-orange-400"
      >
        {t("layout.skipToMain")}
      </a>

      {/* Header */}
      <header className="sticky top-0 z-100 border-b border-stone-200/60 bg-white/80 backdrop-blur-xl dark:border-stone-800/60 dark:bg-stone-950/80">
        <nav
          aria-label={t("layout.mainNav")}
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          {/* Logo + Desktop nav */}
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="group inline-flex min-h-[44px] min-w-[44px] items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:hover:bg-stone-800"
              aria-label={t("nav.homeLabel")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-sm shadow-orange-500/20">
                <Fuel size={16} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-bold tracking-tight text-stone-900 dark:text-white">
                BBM<span className="text-gradient">.id</span>
              </span>
            </NavLink>

            <ul className="hidden items-center gap-1 sm:flex" role="list">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={desktopNavClass}
                      aria-label={t(item.label)}
                    >
                      {({ isActive }) => (
                        <span
                          className="inline-flex items-center gap-2"
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon size={16} aria-hidden="true" />
                          {t(item.label)}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
              {secondaryNav.length > 0 && (
                <li>
                  <DesktopOverflowMenu
                    items={secondaryNav}
                    triggerLabel="nav.more"
                  />
                </li>
              )}
            </ul>
          </div>

          {/* Settings cluster */}
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
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
        aria-label={t("layout.mobileNav")}
        className="fixed inset-x-0 bottom-0 z-100 border-t border-stone-200/80 bg-white/90 backdrop-blur-xl sm:hidden dark:border-stone-800/80 dark:bg-stone-950/90"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavClass}
                aria-label={t(item.label)}
              >
                {({ isActive }) => (
                  <span
                    className="flex flex-col items-center gap-0.5"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span className="text-[10px] font-semibold">
                      {t(item.label)}
                    </span>
                  </span>
                )}
              </NavLink>
            );
          })}
          {secondaryNav.length > 0 && (
            <OverflowMenu items={secondaryNav} triggerLabel="nav.more" />
          )}
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
