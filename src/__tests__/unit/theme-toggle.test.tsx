import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useThemeStore } from "@/stores/theme-store";
import { renderWithI18n } from "@/__tests__/test-utils";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
  });

  it("renders a button with Sun icon and correct aria-label in light mode", () => {
    renderWithI18n(<ThemeToggle />);
    const button = screen.getByRole("button", {
      name: "Ganti ke mode gelap",
    });
    expect(button).toBeInTheDocument();
  });

  it("renders a button with Moon icon and correct aria-label in dark mode", () => {
    useThemeStore.setState({ theme: "dark" });
    renderWithI18n(<ThemeToggle />);
    const button = screen.getByRole("button", {
      name: "Ganti ke mode terang",
    });
    expect(button).toBeInTheDocument();
  });

  it("calls toggleTheme when clicked", () => {
    renderWithI18n(<ThemeToggle />);
    const button = screen.getByRole("button", {
      name: "Ganti ke mode gelap",
    });
    fireEvent.click(button);
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("updates aria-label after toggling from light to dark", () => {
    renderWithI18n(<ThemeToggle />);
    const button = screen.getByRole("button", {
      name: "Ganti ke mode gelap",
    });
    fireEvent.click(button);
    expect(
      screen.getByRole("button", { name: "Ganti ke mode terang" })
    ).toBeInTheDocument();
  });

  it("has a minimum tap target of 44x44px", () => {
    renderWithI18n(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });
});
