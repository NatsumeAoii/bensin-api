import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorState } from "@/components/ErrorState";

describe("ErrorState", () => {
  it("renders error message and retry button as a pair", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Gagal memuat data" onRetry={onRetry} />);

    expect(screen.getByText("Gagal memuat data")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Coba Lagi" })
    ).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Gagal memuat data" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Coba Lagi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows 'Coba lagi nanti' and disables button when disabled is true", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState message="Gagal memuat data" onRetry={onRetry} disabled />
    );

    const button = screen.getByRole("button", { name: "Coba lagi nanti" });
    expect(button).toBeDisabled();
  });

  it("does not call onRetry when button is disabled and clicked", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState message="Gagal memuat data" onRetry={onRetry} disabled />
    );

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi nanti" }));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("uses aria-live='assertive' for screen reader announcement", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Koneksi terlalu lama" onRetry={onRetry} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("shows 'Coba Lagi' button text when not disabled", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        message="Gagal memuat data"
        onRetry={onRetry}
        disabled={false}
      />
    );

    expect(
      screen.getByRole("button", { name: "Coba Lagi" })
    ).not.toBeDisabled();
  });

  it("retry button has minimum 44x44px tap target", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Gagal memuat data" onRetry={onRetry} />);

    const button = screen.getByRole("button", { name: "Coba Lagi" });
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
  });
});
