import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Terminal } from "./Terminal";

describe("Terminal", () => {
  let fullscreenElement: Element | null;
  const exitFullscreen = vi.fn();
  const requestFullscreen = vi.fn();

  // happy-dom has no fullscreen API, so each test adds one and removes it after.
  beforeEach(() => {
    fullscreenElement = null;
    Object.defineProperties(document, {
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: { configurable: true, value: exitFullscreen },
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "fullscreenElement");
    Reflect.deleteProperty(document, "exitFullscreen");
    Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
  });

  it("renders children content", () => {
    render(
      <Terminal>
        <div>Terminal content</div>
      </Terminal>,
    );

    expect(screen.getByText("Terminal content")).toBeInTheDocument();
  });

  it("calls requestFullscreen when maximize button is clicked and not in fullscreen", async () => {
    render(<Terminal>Content</Terminal>);

    await userEvent.click(screen.getByRole("button", { name: "Maximize" }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(exitFullscreen).not.toHaveBeenCalled();
  });

  it("calls exitFullscreen when maximize button is clicked and already in fullscreen", async () => {
    fullscreenElement = document.createElement("div");
    render(<Terminal>Content</Terminal>);

    await userEvent.click(screen.getByRole("button", { name: "Maximize" }));

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("renders the status in the top bar", () => {
    render(
      <Terminal status={<span role="status">live</span>}>
        Example content
      </Terminal>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("live");
  });

  it("renders terminal region with a maximize button only", () => {
    render(<Terminal>Example content</Terminal>);

    const terminal = screen.getByRole("region", { name: "Terminal" });
    expect(within(terminal).getAllByRole("button")).toEqual([
      screen.getByRole("button", { name: "Maximize" }),
    ]);
  });
});
