import { Globals } from "@react-spring/web";
import { act, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnimatedNumber } from "./AnimatedNumber";

function preferReducedMotion() {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  vi.spyOn(query, "matches", "get").mockReturnValue(true);
  vi.spyOn(window, "matchMedia").mockReturnValue(query);
}

beforeEach(() => {
  Globals.assign({ skipAnimation: false });
});

afterEach(() => {
  Globals.assign({ skipAnimation: true });
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

    await act(async () => {
      hydrateRoot(container, <AnimatedNumber value={42} />);
    });

    expect(container).toHaveTextContent("42");
    container.remove();
  });

  it("counts up from zero when rendered on the client", () => {
    render(<AnimatedNumber value={100} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows the value at once with reduced motion", () => {
    preferReducedMotion();

    render(<AnimatedNumber value={50} decimals={2} />);

    expect(screen.getByText("50.00")).toBeInTheDocument();
  });
});
