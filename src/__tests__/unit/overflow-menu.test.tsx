import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BarChart3, Map } from "lucide-react";
import { OverflowMenu, DesktopOverflowMenu } from "@/components/OverflowMenu";
import type { NavItem } from "@/components/OverflowMenu";
import { useLocaleStore } from "@/stores/locale-store";
import { renderWithI18n } from "@/__tests__/test-utils";

const testItems: NavItem[] = [{ to: "/peta", label: "nav.map", icon: Map }];

const multiItems: NavItem[] = [
  { to: "/peta", label: "nav.map", icon: Map },
  { to: "/nasional", label: "nav.national", icon: BarChart3 },
];

function renderMobile(items: NavItem[] = testItems, initialEntry = "/") {
  return renderWithI18n(
    <MemoryRouter initialEntries={[initialEntry]}>
      <OverflowMenu items={items} triggerLabel="nav.more" />
    </MemoryRouter>
  );
}

function renderDesktop(items: NavItem[] = testItems, initialEntry = "/") {
  return renderWithI18n(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DesktopOverflowMenu items={items} triggerLabel="nav.more" />
    </MemoryRouter>
  );
}

describe("OverflowMenu (mobile)", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "id" });
    localStorage.clear();
  });

  it("renders trigger button with correct aria attributes", () => {
    renderMobile();
    const button = screen.getByRole("button", { name: /lainnya/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens menu on trigger click", () => {
    renderMobile();
    const button = screen.getByRole("button", { name: /lainnya/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders menu items when open", () => {
    renderMobile();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(1);
    expect(menuItems[0]).toHaveTextContent("Peta");
  });

  it("closes on second trigger click", () => {
    renderMobile();
    const button = screen.getByRole("button", { name: /lainnya/i });
    fireEvent.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    renderMobile();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on outside click", () => {
    renderMobile();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("navigates with ArrowDown/ArrowUp keys", () => {
    renderMobile(multiItems);
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menuItems = screen.getAllByRole("menuitem");
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[0]);

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[1]);

    // Wraps to first
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[0]);

    // Wraps to last
    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(document.activeElement).toBe(menuItems[1]);
  });

  it("closes when clicking a menu item", () => {
    renderMobile();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menuItem = screen.getByRole("menuitem");
    fireEvent.click(menuItem);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("DesktopOverflowMenu", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "id" });
    localStorage.clear();
  });

  it("renders trigger button with correct aria attributes", () => {
    renderDesktop();
    const button = screen.getByRole("button", { name: /lainnya/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens menu on trigger click", () => {
    renderDesktop();
    const button = screen.getByRole("button", { name: /lainnya/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders menu items with correct text", () => {
    renderDesktop(multiItems);
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent("Peta");
    expect(menuItems[1]).toHaveTextContent("Nasional");
  });

  it("closes on Escape key", () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on outside click", () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("has role=menu on dropdown and role=menuitem on items", () => {
    renderDesktop(multiItems);
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();

    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(2);
  });

  it("navigates with ArrowDown/ArrowUp keys", () => {
    renderDesktop(multiItems);
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    const menuItems = screen.getAllByRole("menuitem");
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[0]);

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[1]);

    // Wraps to first
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it("closes when clicking a menu item", () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    fireEvent.click(screen.getByRole("menuitem"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
