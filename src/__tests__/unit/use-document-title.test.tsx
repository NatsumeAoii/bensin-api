import { render } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { useDocumentTitle } from "@/utils/use-document-title";

function TitleSetter({ title }: { title: string | null }) {
  useDocumentTitle(title);
  return null;
}

describe("useDocumentTitle", () => {
  afterEach(() => {
    document.title = "";
  });

  it("sets the document title with the base suffix", () => {
    render(<TitleSetter title="Daftar Provinsi" />);
    expect(document.title).toBe("Daftar Provinsi — BBM Indonesia");
  });

  it("uses the default title when given null", () => {
    render(<TitleSetter title={null} />);
    expect(document.title).toBe("Harga BBM Terkini — BBM Indonesia");
  });

  it("restores the default title on unmount", () => {
    const { unmount } = render(<TitleSetter title="Perbandingan Nasional" />);
    expect(document.title).toBe("Perbandingan Nasional — BBM Indonesia");

    unmount();
    expect(document.title).toBe("Harga BBM Terkini — BBM Indonesia");
  });

  it("updates the title when the prop changes", () => {
    const { rerender } = render(<TitleSetter title="Aceh" />);
    expect(document.title).toBe("Aceh — BBM Indonesia");

    rerender(<TitleSetter title="Bali" />);
    expect(document.title).toBe("Bali — BBM Indonesia");
  });
});
