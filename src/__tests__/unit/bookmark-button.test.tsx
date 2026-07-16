import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { renderWithI18n } from "@/__tests__/test-utils";

describe("BookmarkButton", () => {
  beforeEach(() => {
    useBookmarkStore.setState({ bookmarks: [] });
    localStorage.clear();
  });

  it("renders Bookmark icon when not bookmarked", () => {
    const { container } = renderWithI18n(<BookmarkButton slug="aceh" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders BookmarkCheck icon when bookmarked", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh"] });
    const { container } = renderWithI18n(<BookmarkButton slug="aceh" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles bookmark on click", () => {
    renderWithI18n(<BookmarkButton slug="aceh" />);
    fireEvent.click(screen.getByRole("button"));
    expect(useBookmarkStore.getState().bookmarks).toContain("aceh");
  });

  it("has correct aria-label when not bookmarked", () => {
    renderWithI18n(<BookmarkButton slug="aceh" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Simpan provinsi"
    );
  });

  it("has correct aria-label when bookmarked", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh"] });
    renderWithI18n(<BookmarkButton slug="aceh" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Hapus dari simpanan"
    );
  });

  it("has minimum 44x44px touch target", () => {
    renderWithI18n(<BookmarkButton slug="aceh" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });
});
