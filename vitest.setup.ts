import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { Globals } from "@react-spring/web";

Globals.assign({ skipAnimation: true });

afterEach(() => {
  cleanup();
});
