import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { filterByRange } from "@/utils/history-range";
import { apiClient, ApiError } from "@/api/client";
import type { HistoryPoint, HistoryResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// filterByRange — range slicing with carry-in point
// ---------------------------------------------------------------------------

describe("filterByRange", () => {
  const now = new Date("2026-06-07T00:00:00Z");

  const points: HistoryPoint[] = [
    { date: "2026-01-01", price_rupiah: 12000 },
    { date: "2026-03-01", price_rupiah: 12500 },
    { date: "2026-06-01", price_rupiah: 12600 },
  ];

  it("returns all points when range is null (all-time)", () => {
    expect(filterByRange(points, null, now)).toEqual(points);
  });

  it("returns empty array for empty input", () => {
    expect(filterByRange([], 30, now)).toEqual([]);
  });

  it("keeps the last point before the window as a carry-in", () => {
    // 30-day window from 2026-06-07 → cutoff 2026-05-08.
    // Only the 2026-06-01 point is inside; 2026-03-01 should carry in so the
    // step line starts at the correct price.
    const result = filterByRange(points, 30, now);
    expect(result).toEqual([
      { date: "2026-03-01", price_rupiah: 12500 },
      { date: "2026-06-01", price_rupiah: 12600 },
    ]);
  });

  it("includes all points within a wide window without duplicate carry", () => {
    const result = filterByRange(points, 365, now);
    expect(result).toEqual(points);
  });

  it("skips points with unparseable dates", () => {
    const withBad: HistoryPoint[] = [
      { date: "not-a-date", price_rupiah: 999 },
      { date: "2026-06-01", price_rupiah: 12600 },
    ];
    expect(filterByRange(withBad, 30, now)).toEqual([
      { date: "2026-06-01", price_rupiah: 12600 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// PriceHistoryChart — states
// ---------------------------------------------------------------------------

describe("PriceHistoryChart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sample: HistoryResponse = {
    province: "Prov. Aceh",
    province_slug: "aceh",
    products: {
      PERTAMAX: [
        { date: "2026-05-01", price_rupiah: 12400 },
        { date: "2026-06-01", price_rupiah: 12600 },
      ],
    },
  };

  it("renders the chart when history loads", async () => {
    vi.spyOn(apiClient, "getHistory").mockResolvedValue(sample);

    render(<PriceHistoryChart slug="aceh" />);

    await waitFor(() => {
      expect(screen.getByText("Riwayat Harga")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("img", { name: /Grafik riwayat harga/ })
    ).toBeInTheDocument();
  });

  it("shows the empty state when no products exist", async () => {
    vi.spyOn(apiClient, "getHistory").mockResolvedValue({
      province: "Prov. Aceh",
      province_slug: "aceh",
      products: {},
    });

    render(<PriceHistoryChart slug="aceh" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Riwayat harga belum tersedia/)
      ).toBeInTheDocument();
    });
  });

  it("treats a 404 as empty (history not yet generated)", async () => {
    vi.spyOn(apiClient, "getHistory").mockRejectedValue(
      new ApiError("HTTP 404", "HTTP_ERROR", 404)
    );

    render(<PriceHistoryChart slug="aceh" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Riwayat harga belum tersedia/)
      ).toBeInTheDocument();
    });
  });

  it("shows an error state with retry on non-404 failure", async () => {
    vi.spyOn(apiClient, "getHistory").mockRejectedValue(
      new ApiError("Koneksi terlalu lama", "TIMEOUT")
    );

    render(<PriceHistoryChart slug="aceh" />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Coba lagi/ })
      ).toBeInTheDocument();
    });
  });
});
