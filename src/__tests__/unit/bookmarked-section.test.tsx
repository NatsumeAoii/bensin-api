import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BookmarkedSection } from "@/components/BookmarkedSection";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { renderWithI18n } from "@/__tests__/test-utils";

const names = {
  aceh: "Aceh",
  bali: "Bali",
  "dki-jakarta": "DKI Jakarta",
};

function renderSection() {
  return renderWithI18n(
    <MemoryRouter>
      <BookmarkedSection provinceNames={names} />
    </MemoryRouter>
  );
}

describe("BookmarkedSection", () => {
  beforeEach(() => {
    useBookmarkStore.setState({ bookmarks: [] });
    localStorage.clear();
  });

  it("renders nothing when no bookmarks", () => {
    const { container } = renderSection();
    expect(container.textContent).toBe("");
  });

  it("shows bookmarked province names", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh", "bali"] });
    renderSection();
    expect(screen.getByText("Aceh")).toBeInTheDocument();
    expect(screen.getByText("Bali")).toBeInTheDocument();
  });

  it("shows the section header", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh"] });
    renderSection();
    expect(screen.getByText("Provinsi Tersimpan")).toBeInTheDocument();
  });

  it("shows count badge", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh", "bali"] });
    renderSection();
    expect(screen.getByText("2 tersimpan")).toBeInTheDocument();
  });

  it("clear all button requires confirmation", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh"] });
    renderSection();

    const clearBtn = screen.getByText("Hapus semua");
    fireEvent.click(clearBtn);

    // First click shows confirmation
    expect(
      screen.getByText("Hapus semua provinsi tersimpan?")
    ).toBeInTheDocument();
    expect(useBookmarkStore.getState().bookmarks).toEqual(["aceh"]);

    // Second click actually clears
    const confirmBtn = screen.getByText("Hapus semua");
    fireEvent.click(confirmBtn);
    expect(useBookmarkStore.getState().bookmarks).toEqual([]);
  });

  it("links navigate to province pages", () => {
    useBookmarkStore.setState({ bookmarks: ["aceh"] });
    renderSection();
    const link = screen.getByText("Aceh").closest("a");
    expect(link).toHaveAttribute("href", "/provinsi/aceh");
  });
});
