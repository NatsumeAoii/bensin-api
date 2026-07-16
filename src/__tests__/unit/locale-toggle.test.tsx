import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocaleStore } from "@/stores/locale-store";
import { renderWithI18n } from "@/__tests__/test-utils";

describe("LocaleToggle", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "id" });
    localStorage.clear();
  });

  it("renders with 'ID' text when locale is Indonesian", () => {
    useLocaleStore.setState({ locale: "id" });
    renderWithI18n(<LocaleToggle />);

    expect(screen.getByText("ID")).toBeInTheDocument();
  });

  it("renders with 'EN' text when locale is English", () => {
    useLocaleStore.setState({ locale: "en" });
    renderWithI18n(<LocaleToggle />);

    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("has correct aria-label for switching to English (when in ID mode)", () => {
    useLocaleStore.setState({ locale: "id" });
    renderWithI18n(<LocaleToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to English");
  });

  it("has correct aria-label for switching to Indonesian (when in EN mode)", () => {
    useLocaleStore.setState({ locale: "en" });
    renderWithI18n(<LocaleToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Ganti ke Bahasa Indonesia");
  });

  it("toggles locale from id to en on click", () => {
    useLocaleStore.setState({ locale: "id" });
    renderWithI18n(<LocaleToggle />);

    fireEvent.click(screen.getByRole("button"));

    expect(useLocaleStore.getState().locale).toBe("en");
  });

  it("toggles locale from en to id on click", () => {
    useLocaleStore.setState({ locale: "en" });
    renderWithI18n(<LocaleToggle />);

    fireEvent.click(screen.getByRole("button"));

    expect(useLocaleStore.getState().locale).toBe("id");
  });

  it("has minimum 44x44px touch target", () => {
    renderWithI18n(<LocaleToggle />);
    const button = screen.getByRole("button");

    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });

  it("renders the Languages icon", () => {
    const { container } = renderWithI18n(<LocaleToggle />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
