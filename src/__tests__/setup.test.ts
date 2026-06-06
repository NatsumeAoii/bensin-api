import { describe, it, expect } from "vitest";
import App from "@/App";

describe("vitest configuration", () => {
  it("runs with jsdom environment", () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  it("resolves @ path alias", () => {
    expect(App).toBeDefined();
  });
});
