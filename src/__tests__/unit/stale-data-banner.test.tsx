import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { renderWithI18n } from "@/__tests__/test-utils";

describe("StaleDataBanner", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderWithI18n(<StaleDataBanner visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the warning when visible", () => {
    renderWithI18n(<StaleDataBanner visible={true} />);
    expect(
      screen.getByText(/Data mungkin sudah tidak terbaru/)
    ).toBeInTheDocument();
  });

  it("uses role='status' with aria-live='polite'", () => {
    renderWithI18n(<StaleDataBanner visible={true} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
