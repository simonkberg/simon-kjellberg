// @vitest-environment node

import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

import { http, HttpResponse, passthrough } from "msw";
import { afterEach, expect, it, vi } from "vitest";

import { log } from "@/lib/log";
import { MIGRATIONS } from "@/lib/migrations";
import { query } from "@/lib/turso";
import { server } from "@/mocks/node";
import { createSqliteQuery } from "@/mocks/sqlite";

import { createMessage } from "./anthropic";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("@/lib/turso"), () => ({ query: vi.fn() }));
vi.mock(import("node:timers/promises"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, setTimeout: vi.fn() };
});

async function closedPort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((resolve) =>
    listener.listen(0, "127.0.0.1", resolve),
  );
  const address = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  if (address === null || typeof address === "string") {
    throw new Error("No port");
  }
  return address.port;
}

afterEach(() => {
  vi.restoreAllMocks();
});

// Pins the error Node's own fetch throws, which the retry gate relies on.
it("should retry Node's fetch failing to connect", async () => {
  vi.mocked(query).mockImplementation(createSqliteQuery(MIGRATIONS));
  vi.spyOn(log, "info").mockImplementation(() => {});
  vi.spyOn(log, "warn").mockImplementation(() => {});
  const url = `http://127.0.0.1:${await closedPort()}`;
  const realFetch = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementationOnce((_input, init) =>
    realFetch(url, init),
  );
  server.use(
    http.post(url, () => passthrough()),
    http.post("https://api.anthropic.com/v1/messages", () =>
      HttpResponse.json({
        content: [{ type: "text", text: "reached" }],
        stop_reason: "end_turn",
      }),
    ),
  );

  const responses = await Array.fromAsync(
    createMessage([{ role: "user", username: "test-user", content: "Test" }]),
  );

  expect(responses).toEqual(["reached"]);
  expect(vi.mocked(sleep).mock.calls).toEqual([[500]]);
  expect(log.warn).toHaveBeenCalledWith(
    expect.objectContaining({
      err: expect.objectContaining({
        name: "TypeError",
        cause: expect.objectContaining({ code: "ECONNREFUSED" }),
      }),
    }),
    "simon-bot retrying request",
  );
});
