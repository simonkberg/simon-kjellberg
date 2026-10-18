import "@testing-library/jest-dom/vitest";
import { Globals } from "@react-spring/web";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { log } from "@/lib/log";
import { server } from "@/mocks/node";

Globals.assign({ skipAnimation: true });
configure({ reactStrictMode: true });

// happy-dom has no popover API: these mark an open popover with an attribute tests can query.
if (
  "HTMLElement" in globalThis &&
  typeof HTMLElement.prototype.showPopover !== "function"
) {
  const setOpen = (element: HTMLElement, open: boolean) => {
    if (!element.hasAttribute("popover")) {
      throw new DOMException("Not a popover", "NotSupportedError");
    }
    element.toggleAttribute("data-popover-open", open);
  };
  HTMLElement.prototype.showPopover = function () {
    setOpen(this, true);
  };
  HTMLElement.prototype.hidePopover = function () {
    setOpen(this, false);
  };
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

// Tests assert on log calls through vi.mocked(log.<level>); none should print.
beforeEach(() => {
  for (const level of [
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
  ] as const) {
    vi.spyOn(log, level).mockImplementation(() => {});
  }
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
