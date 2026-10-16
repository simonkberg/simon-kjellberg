import "@testing-library/jest-dom/vitest";
import { Globals } from "@react-spring/web";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "@/mocks/node";

Globals.assign({ skipAnimation: true });
configure({ reactStrictMode: true });

// happy-dom has no popover API: these mark an open popover with an attribute tests can query.
if ("HTMLElement" in globalThis) {
  HTMLElement.prototype.showPopover = function () {
    this.toggleAttribute("data-popover-open", true);
  };
  HTMLElement.prototype.hidePopover = function () {
    this.toggleAttribute("data-popover-open", false);
  };
}

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
