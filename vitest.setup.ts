import "@testing-library/jest-dom/vitest";

import { server } from "@/mocks/node";
import { Globals } from "@react-spring/web";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

Globals.assign({ skipAnimation: true });
configure({ reactStrictMode: true });

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
