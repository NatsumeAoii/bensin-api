import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";

describe("StaleTimeBanner", () => {
  const now = new Date("2026-06-05T12:00:00Z");

  // Pipeline syncs every 6h; banner warns only after >13h (two cycles + buffer).

  it("renders nothing when the sync is recent (under the threshold)", () => {
    const sixHoursAgo = new Date("2026-06-05T06:00:00Z").toISOString();
    const { container } = render(
      <StaleTimeBanner syncedAt={sixHoursAgo} now={now} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when a single sync is missed (12h old)", () => {
    const twelveHoursAgo = new Date("2026-06-05T00:00:00Z").toISOString();
    const { container } = render(
      <StaleTimeBanner syncedAt={twelveHoursAgo} now={now} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a warning when the sync is overdue (older than 13h)", () => {
    const fourteenHoursAgo = new Date("2026-06-04T22:00:00Z").toISOString();
    render(<StaleTimeBanner syncedAt={fourteenHoursAgo} now={now} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Data terakhir diperbarui/)).toBeInTheDocument();
  });

  it("renders the warning exactly at the 13-hour boundary", () => {
    const exactlyThirteenHoursAgo = new Date("2026-06-04T23:00:00Z").toISOString();
    render(<StaleTimeBanner syncedAt={exactlyThirteenHoursAgo} now={now} />);

    // Boundary is inclusive: at exactly 13h the data is considered stale
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders nothing for an unparseable timestamp", () => {
    const { container } = render(
      <StaleTimeBanner syncedAt="not-a-date" now={now} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses aria-live='polite' for non-intrusive announcement", () => {
    const twoDaysAgo = new Date("2026-06-03T12:00:00Z").toISOString();
    render(<StaleTimeBanner syncedAt={twoDaysAgo} now={now} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
