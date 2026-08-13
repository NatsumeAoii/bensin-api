import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/__tests__/test-utils";
import { SourceStatusBanner } from "@/components/SourceStatusBanner";

describe("SourceStatusBanner", () => {
  it("shows a fresh source status", () => {
    renderWithI18n(<SourceStatusBanner status="fresh" />);
    expect(
      screen.getByText("Data berhasil diperbarui dari sumber")
    ).toBeInTheDocument();
  });

  it("shows fallback source age", () => {
    renderWithI18n(
      <SourceStatusBanner
        status="fallback"
        sourceSnapshotAt="2026-08-13T00:00:00Z"
      />
    );
    const message = screen.getByText(/snapshot sebelumnya/);
    expect(message).toBeInTheDocument();
    expect(message).not.toHaveTextContent("2026-08-13T00:00:00Z");
  });

  it("keeps legacy snapshots quiet when metadata is absent", () => {
    const { container } = renderWithI18n(<SourceStatusBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
