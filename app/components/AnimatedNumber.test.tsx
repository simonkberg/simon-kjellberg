import { Globals } from "@react-spring/web";
import { act, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, onTestFinished } from "vitest";

import { mockReducedMotion } from "@/mocks/matchMedia";

import { AnimatedNumber } from "./AnimatedNumber";

beforeEach(() => {
  Globals.assign({ skipAnimation: false });
});

describe("AnimatedNumber", () => {
  it("renders the value in server markup", () => {
    expect(renderToString(<AnimatedNumber value={42.5} decimals={2} />)).toBe(
      "<span>42.50</span>",
    );
  });

  it("keeps the server value when hydrating", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<AnimatedNumber value={42} />);
    document.body.append(container);
    const root = await act(async () =>
      hydrateRoot(container, <AnimatedNumber value={42} />),
    );
    onTestFinished(() => {
      act(() => root.unmount());
      container.remove();
    });

    expect(container).toHaveTextContent("42");
  });

  it("counts up from zero when rendered on the client", () => {
    render(<AnimatedNumber value={100} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows the value at once with reduced motion", () => {
    mockReducedMotion(true);

    render(<AnimatedNumber value={50} decimals={2} />);

    expect(screen.getByText("50.00")).toBeInTheDocument();
  });
});
