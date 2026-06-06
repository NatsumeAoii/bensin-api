import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaleDataBanner } from "@/components/StaleDataBanner";

describe("StaleDataBanner", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(<StaleDataBanner visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the warning when visible", () => {
    render(<StaleDataBanner visible={true} />);
    expect(
      screen.getByText(/Data mungkin sudah tidak terbaru/)
    ).toBeInTheDocument();
  });

  it("uses role='status' with aria-live='polite'", () => {
    render(<StaleDataBanner visible={true} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
