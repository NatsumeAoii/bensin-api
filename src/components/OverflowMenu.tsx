import { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { TranslationKey } from "@/i18n";

export interface NavItem {
  to: string;
  label: TranslationKey;
  icon: LucideIcon;
  end?: boolean;
}

interface OverflowMenuProps {
  items: NavItem[];
  /** Label key for the trigger button aria-label */
  triggerLabel: TranslationKey;
}

/**
 * Overflow/dropdown menu for secondary nav items.
 * Desktop: dropdown anchored to trigger button.
 * Mobile: rendered inline in mobile bottom nav context via children.
 */
export function OverflowMenu({ items, triggerLabel }: OverflowMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close on route change — setState in effect is correct here because
  // location changes are an external event, not a cascading render.
  useEffect(() => {
    setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape + keyboard nav inside menu
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const menuItems =
          menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!menuItems?.length) return;
        const current = document.activeElement;
        const idx = Array.from(menuItems).indexOf(current as HTMLElement);
        const next =
          e.key === "ArrowDown"
            ? idx < menuItems.length - 1
              ? idx + 1
              : 0
            : idx > 0
              ? idx - 1
              : menuItems.length - 1;
        menuItems[next].focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t(triggerLabel)}
        className={mobileNavClass({ isActive: false })}
      >
        <span className="flex flex-col items-center gap-0.5">
          <MoreHorizontal size={20} aria-hidden="true" />
          <span className="text-[10px] font-semibold">{t(triggerLabel)}</span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-1/2 z-50 mb-2 min-w-[160px] -translate-x-1/2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="menuitem"
                end={item.end}
                className={desktopNavClass}
                onClick={close}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Desktop overflow trigger in the header nav.
 */
export function DesktopOverflowMenu({
  items,
  triggerLabel,
}: OverflowMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const menuItems =
          menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!menuItems?.length) return;
        const current = document.activeElement;
        const idx = Array.from(menuItems).indexOf(current as HTMLElement);
        const next =
          e.key === "ArrowDown"
            ? idx < menuItems.length - 1
              ? idx + 1
              : 0
            : idx > 0
              ? idx - 1
              : menuItems.length - 1;
        menuItems[next].focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t(triggerLabel)}
        className={desktopNavClass({ isActive: false })}
      >
        <span className="inline-flex items-center gap-2">
          <MoreHorizontal size={16} aria-hidden="true" />
          {t(triggerLabel)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="menuitem"
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                    isActive
                      ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
                  }`
                }
                onClick={close}
              >
                <Icon size={16} aria-hidden="true" />
                {t(item.label)}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function desktopNavClass({ isActive }: { isActive: boolean }): string {
  const base =
    "inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";
  const active =
    "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
  const inactive =
    "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white";
  return `${base} ${isActive ? active : inactive}`;
}

function mobileNavClass({ isActive }: { isActive: boolean }): string {
  const base =
    "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";
  const active = "text-orange-600 dark:text-orange-400";
  const inactive = "text-stone-500 dark:text-stone-400";
  return `${base} ${isActive ? active : inactive}`;
}
