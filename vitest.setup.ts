import { Globals } from "@react-spring/web";
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

Globals.assign({ skipAnimation: true });
configure({ reactStrictMode: true });

afterEach(() => {
  cleanup();
});
