import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RefreshButton } from "@/components/RefreshButton";
import { renderWithI18n } from "@/__tests__/test-utils";

describe("RefreshButton", () => {
  it("renders a button with an accessible label", () => {
    renderWithI18n(<RefreshButton onRefresh={vi.fn()} loading={false} />);
    expect(
      screen.getByRole("button", { name: "Perbarui data" })
    ).toBeInTheDocument();
  });

  it("calls onRefresh when clicked", () => {
    const onRefresh = vi.fn();
    renderWithI18n(<RefreshButton onRefresh={onRefresh} loading={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Perbarui data" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("is disabled while loading", () => {
    renderWithI18n(<RefreshButton onRefresh={vi.fn()} loading={true} />);
    expect(
      screen.getByRole("button", { name: "Perbarui data" })
    ).toBeDisabled();
  });

  it("does not call onRefresh when disabled and clicked", () => {
    const onRefresh = vi.fn();
    renderWithI18n(<RefreshButton onRefresh={onRefresh} loading={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Perbarui data" }));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("has a minimum 44x44px tap target", () => {
    renderWithI18n(<RefreshButton onRefresh={vi.fn()} loading={false} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });
});
