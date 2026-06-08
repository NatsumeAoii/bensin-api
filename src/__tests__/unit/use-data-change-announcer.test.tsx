import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useDataChangeAnnouncer } from "@/utils/use-data-change-announcer";

function Harness({
  fingerprint,
  message,
}: {
  fingerprint: string | null;
  message: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDataChangeAnnouncer(fingerprint, ref, message);
  return <div data-testid="live" ref={ref} />;
}

describe("useDataChangeAnnouncer", () => {
  it("does not announce on the first observed fingerprint", () => {
    const { getByTestId } = render(
      <Harness fingerprint="a" message="updated" />
    );
    expect(getByTestId("live").textContent).toBe("");
  });

  it("announces when the fingerprint changes from a seen value", () => {
    const { getByTestId, rerender } = render(
      <Harness fingerprint="a" message="updated" />
    );
    rerender(<Harness fingerprint="b" message="updated" />);
    expect(getByTestId("live").textContent).toBe("updated");
  });

  it("does not announce when the fingerprint is unchanged", () => {
    const { getByTestId, rerender } = render(
      <Harness fingerprint="a" message="updated" />
    );
    rerender(<Harness fingerprint="a" message="updated" />);
    expect(getByTestId("live").textContent).toBe("");
  });

  it("ignores a null fingerprint", () => {
    const { getByTestId, rerender } = render(
      <Harness fingerprint={null} message="updated" />
    );
    rerender(<Harness fingerprint={null} message="updated" />);
    expect(getByTestId("live").textContent).toBe("");
  });
});
