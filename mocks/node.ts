import { setupServer } from "msw/node";

if (process.env.NODE_ENV !== "test") {
  throw new Error("@/mocks/node should only be imported in test environment");
}

export const server = setupServer();
