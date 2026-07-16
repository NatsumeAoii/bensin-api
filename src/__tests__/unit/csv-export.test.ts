import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToCsv } from "@/utils/csv-export";

let capturedBlob: Blob | null = null;
const mockClick = vi.fn();

beforeEach(() => {
  capturedBlob = null;
  mockClick.mockClear();
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob: Blob) => {
    capturedBlob = blob;
    return "blob:mock";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(document, "createElement").mockReturnValue({
    click: mockClick,
    href: "",
    download: "",
  } as unknown as HTMLAnchorElement);
});

async function getBlobBytes(): Promise<Uint8Array> {
  expect(capturedBlob).not.toBeNull();
  const buf = await capturedBlob!.arrayBuffer();
  return new Uint8Array(buf);
}

async function getBlobContent(): Promise<string> {
  const bytes = await getBlobBytes();
  const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
  return decoder.decode(bytes);
}

describe("exportToCsv", () => {
  it("produces a header-only CSV when rows is empty", async () => {
    exportToCsv("test.csv", ["A", "B"], []);
    const text = await getBlobContent();
    expect(text).toBe("\uFEFFA,B");
  });

  it("includes header and data rows", async () => {
    exportToCsv("test.csv", ["Name", "Value"], [["foo", 42]]);
    const text = await getBlobContent();
    expect(text).toBe("\uFEFFName,Value\nfoo,42");
  });

  it("escapes commas, quotes, and newlines", async () => {
    exportToCsv("test.csv", ["X"], [["a,b", 'say "hi"', "line1\nline2"]]);
    const text = await getBlobContent();
    expect(text).toBe('\uFEFFX\n"a,b","say ""hi""","line1\nline2"');
  });

  it("starts with UTF-8 BOM for Excel compatibility", async () => {
    exportToCsv("test.csv", ["H"], [[1]]);
    const bytes = await getBlobBytes();
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it("triggers a download with the given filename", () => {
    exportToCsv("riwayat-aceh-pertalite-1y.csv", ["A"], []);
    expect(mockClick).toHaveBeenCalledOnce();
  });
});
