import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="Tidak ada data harga untuk provinsi ini" />);

    expect(
      screen.getByText("Tidak ada data harga untuk provinsi ini")
    ).toBeInTheDocument();
  });

  it("does not render action button when action is not provided", () => {
    render(<EmptyState message="Tidak ada data" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders action button when action is provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="Tidak ada hasil"
        action={{ label: "Hapus filter", onClick }}
      />
    );

    expect(screen.getByRole("button", { name: "Hapus filter" })).toBeInTheDocument();
  });

  it("calls action onClick when action button is clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="Tidak ada hasil"
        action={{ label: "Hapus filter", onClick }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("action button has minimum 44x44px tap target", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="Tidak ada hasil"
        action={{ label: "Hapus filter", onClick }}
      />
    );

    const button = screen.getByRole("button", { name: "Hapus filter" });
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });
});
