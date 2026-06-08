import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ShareButton } from "@/components/ShareButton";

/**
 * Helper to (re)define a navigator property for a single test.
 * Returns a cleanup function to restore the original descriptor.
 */
function defineNavigatorProp(prop: string, value: unknown): () => void {
  const original = Object.getOwnPropertyDescriptor(navigator, prop);
  Object.defineProperty(navigator, prop, {
    value,
    configurable: true,
    writable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(navigator, prop, original);
    } else {
      // @ts-expect-error — cleanup of test-only property
      delete navigator[prop];
    }
  };
}

describe("ShareButton", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
    vi.restoreAllMocks();
  });

  it("renders with a 'Bagikan' label", () => {
    render(<ShareButton title="Harga BBM Aceh" text="Lihat harga" />);
    expect(screen.getByText("Bagikan")).toBeInTheDocument();
  });

  it("falls back to clipboard copy on non-touch devices", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    cleanups.push(defineNavigatorProp("clipboard", { writeText }));
    // No touch support → desktop path
    cleanups.push(defineNavigatorProp("maxTouchPoints", 0));
    cleanups.push(defineNavigatorProp("share", undefined));

    render(<ShareButton title="Harga BBM Aceh" text="Lihat harga" />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });

    // Shows the "Disalin" confirmation
    expect(await screen.findByText("Disalin")).toBeInTheDocument();
  });

  it("uses native share on touch devices when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    cleanups.push(defineNavigatorProp("share", share));
    cleanups.push(defineNavigatorProp("maxTouchPoints", 5));

    render(<ShareButton title="Harga BBM Aceh" text="Lihat harga" />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(share).toHaveBeenCalledTimes(1);
    });
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Harga BBM Aceh",
        text: "Lihat harga",
        url: window.location.href,
      })
    );
  });

  it("does not throw when the user cancels native share (AbortError)", async () => {
    const abortError = new Error("cancelled");
    abortError.name = "AbortError";
    const share = vi.fn().mockRejectedValue(abortError);
    const writeText = vi.fn().mockResolvedValue(undefined);
    cleanups.push(defineNavigatorProp("share", share));
    cleanups.push(defineNavigatorProp("maxTouchPoints", 5));
    cleanups.push(defineNavigatorProp("clipboard", { writeText }));

    render(<ShareButton title="Harga BBM Aceh" text="Lihat harga" />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    // On abort, it should NOT fall through to clipboard
    expect(writeText).not.toHaveBeenCalled();
  });

  it("surfaces an error state when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    cleanups.push(defineNavigatorProp("clipboard", { writeText }));
    cleanups.push(defineNavigatorProp("maxTouchPoints", 0));
    cleanups.push(defineNavigatorProp("share", undefined));

    render(<ShareButton title="Harga BBM Aceh" text="Lihat harga" />);
    fireEvent.click(screen.getByRole("button"));

    // The action is not silent — a failure message is shown.
    expect(await screen.findByText("Gagal menyalin")).toBeInTheDocument();
  });
});
