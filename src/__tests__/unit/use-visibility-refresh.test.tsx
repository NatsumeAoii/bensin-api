import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVisibilityRefresh } from "@/utils/use-visibility-refresh";

function RefreshHarness({
  refreshFn,
  staleAfterMs,
}: {
  refreshFn: () => void;
  staleAfterMs?: number;
}) {
  useVisibilityRefresh(refreshFn, staleAfterMs);
  return null;
}

/** Sets document.visibilityState and dispatches the visibilitychange event. */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useVisibilityRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("does not refresh when the tab becomes visible before data is stale", () => {
    const refreshFn = vi.fn();
    render(<RefreshHarness refreshFn={refreshFn} staleAfterMs={5000} />);

    // Only 1 second passes — not stale yet
    vi.advanceTimersByTime(1000);
    setVisibility("hidden");
    setVisibility("visible");

    expect(refreshFn).not.toHaveBeenCalled();
  });

  it("refreshes when the tab becomes visible after data is stale", () => {
    const refreshFn = vi.fn();
    render(<RefreshHarness refreshFn={refreshFn} staleAfterMs={5000} />);

    // 6 seconds pass — now stale
    vi.advanceTimersByTime(6000);
    setVisibility("hidden");
    setVisibility("visible");

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the tab becomes hidden", () => {
    const refreshFn = vi.fn();
    render(<RefreshHarness refreshFn={refreshFn} staleAfterMs={5000} />);

    vi.advanceTimersByTime(6000);
    setVisibility("hidden");

    expect(refreshFn).not.toHaveBeenCalled();
  });

  it("removes the event listener on unmount", () => {
    const refreshFn = vi.fn();
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<RefreshHarness refreshFn={refreshFn} />);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
  });
});
