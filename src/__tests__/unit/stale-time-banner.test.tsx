import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaleTimeBanner } from "@/components/StaleTimeBanner";

describe("StaleTimeBanner", () => {
  const now = new Date("2026-06-05T12:00:00Z");

  it("renders nothing when data is fresh (under 2 hours old)", () => {
    const oneHourAgo = new Date("2026-06-05T11:00:00Z").toISOString();
    const { container } = render(
      <StaleTimeBanner updatedAt={oneHourAgo} now={now} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a warning when data is older than 2 hours", () => {
    const threeHoursAgo = new Date("2026-06-05T09:00:00Z").toISOString();
    render(<StaleTimeBanner updatedAt={threeHoursAgo} now={now} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Data terakhir diperbarui/)).toBeInTheDocument();
  });

  it("renders the warning exactly at the 2-hour boundary", () => {
    const exactlyTwoHoursAgo = new Date("2026-06-05T10:00:00Z").toISOString();
    render(<StaleTimeBanner updatedAt={exactlyTwoHoursAgo} now={now} />);

    // Boundary is inclusive: at exactly 2h the data is considered stale
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders nothing for an unparseable timestamp", () => {
    const { container } = render(
      <StaleTimeBanner updatedAt="not-a-date" now={now} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses aria-live='polite' for non-intrusive announcement", () => {
    const oneDayAgo = new Date("2026-06-04T12:00:00Z").toISOString();
    render(<StaleTimeBanner updatedAt={oneDayAgo} now={now} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
