// @vitest-environment node

import { http, HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { addBotReaction, DiscordApiError } from "@/lib/discord/api";
import { resetGlobal } from "@/lib/global";
import { identifiers } from "@/lib/identifiers";
import { IP_DENY_LIST_URL, refreshIpDenyList } from "@/lib/ipDenyList";
import { log } from "@/lib/log";
import { MIGRATIONS } from "@/lib/migrations";
import { decrypt, type Username } from "@/lib/session";
import { query } from "@/lib/turso";
import { server } from "@/mocks/node";
import { createSqliteQuery } from "@/mocks/sqlite";

import { POST } from "./route";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("next/cache"), () => ({ revalidateTag: vi.fn() }));
vi.mock(import("@/lib/identifiers"), () => ({
  identifiers: vi.fn(() =>
    Promise.resolve({ ip: "0.0.0.0", userAgent: "vitest" }),
  ),
}));
vi.mock(import("@/lib/session"), () => ({
  decrypt: vi.fn(() => Promise.resolve({ username: "test-user" as Username })),
}));
vi.mock(import("@/lib/discord/api"));
vi.mock(import("@/lib/turso"), () => ({ query: vi.fn() }));

function react(
  body: unknown,
  headers: Record<string, string> = {
    origin: "https://simon.dev",
    host: "simon.dev",
  },
) {
  return POST(
    new NextRequest("https://simon.dev/api/chat/reactions", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function result(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("POST /api/chat/reactions", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ["Date"] });
    vi.spyOn(log, "info").mockImplementation(() => {});
    vi.spyOn(log, "error").mockImplementation(() => {});
    vi.spyOn(log, "warn").mockImplementation(() => {});
    resetGlobal("simon.dev/rate-limit-blocked");
    resetGlobal("simon.dev/ip-deny-list");
    server.use(http.get(IP_DENY_LIST_URL, () => new HttpResponse("6.6.6.6\n")));
    await refreshIpDenyList();
    vi.mocked(query).mockImplementation(createSqliteQuery(MIGRATIONS));
    vi.mocked(addBotReaction).mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("toggles the visitor's reaction and expires the history", async () => {
    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({ status: 200, body: { status: "ok" } });

    expect(
      (await query("SELECT message_id, emoji, username FROM reactions")).rows,
    ).toEqual([{ message_id: "123", emoji: "👍", username: "test-user" }]);
    expect(revalidateTag).toHaveBeenCalledWith("getChatHistory", { expire: 0 });
  });

  it("asks a visitor without a session to reload", async () => {
    vi.mocked(decrypt).mockResolvedValueOnce(undefined);

    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({
      status: 401,
      body: { status: "error", error: "Reload the page to react" },
    });
    expect(log.error).not.toHaveBeenCalled();
    expect(addBotReaction).not.toHaveBeenCalled();
  });

  it("accepts the host a proxy forwarded", async () => {
    const response = await react(
      { messageId: "123", emoji: "👍" },
      {
        origin: "https://simon.dev",
        host: "internal:3000",
        "x-forwarded-host": "simon.dev",
      },
    );

    expect(response.status).toBe(200);
  });

  it.each([
    [
      "from another site",
      { origin: "https://evil.example", host: "simon.dev" },
      { origin: "https://evil.example", host: "simon.dev" },
    ],
    [
      "without an origin",
      { host: "simon.dev" },
      { origin: null, host: "simon.dev" },
    ],
    [
      "whose origin isn't a URL",
      { origin: "null", host: "simon.dev" },
      { origin: "null", host: "simon.dev" },
    ],
    [
      "whose forwarded host differs",
      {
        origin: "https://simon.dev",
        host: "simon.dev",
        "x-forwarded-host": "evil.example",
      },
      { origin: "https://simon.dev", host: "evil.example" },
    ],
  ])("refuses a request %s", async (_, headers, logged) => {
    const response = await react({ messageId: "123", emoji: "👍" }, headers);

    expect(response.status).toBe(403);
    expect(addBotReaction).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining(logged),
      "Refused origin",
    );
  });

  it.each([
    [
      "a message ID that isn't a snowflake",
      { messageId: "../123", emoji: "👍" },
    ],
    ["text that isn't one emoji", { messageId: "123", emoji: "nice" }],
    ["a body that isn't JSON", "{"],
  ])("rejects %s", async (_, body) => {
    expect(await result(await react(body))).toEqual({
      status: 400,
      body: { status: "error", error: "Failed to react to chat message" },
    });
    expect(addBotReaction).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(z.ZodError) }),
      "Malformed reaction",
    );
  });

  it("turns away an IP on the deny list", async () => {
    vi.mocked(identifiers).mockResolvedValueOnce({
      ip: "6.6.6.6",
      userAgent: "vitest",
    });

    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({
      status: 429,
      body: {
        status: "error",
        error: "Reacting from your network is blocked.",
      },
    });
  });

  it("rejects the 31st reaction in a minute", async () => {
    for (let i = 0; i < 30; i++) {
      expect((await react({ messageId: "123", emoji: "👍" })).status).toBe(200);
    }

    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({
      status: 429,
      body: {
        status: "error",
        error: "Rate limit exceeded. Wait 60 seconds before trying again.",
      },
    });
  });

  it("counts malformed reactions against the limit", async () => {
    for (let i = 0; i < 30; i++) {
      await react({ messageId: "not-an-id", emoji: "👍" });
    }

    expect((await react({ messageId: "123", emoji: "👍" })).status).toBe(429);
  });

  it("returns error when Discord rejects the reaction", async () => {
    vi.mocked(addBotReaction).mockRejectedValueOnce(new Error("Unknown"));

    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({
      status: 500,
      body: { status: "error", error: "Failed to react to chat message" },
    });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("explains Discord's cap on emoji per message", async () => {
    // The module is automocked, so the constructor doesn't set the code.
    vi.mocked(addBotReaction).mockRejectedValueOnce(
      Object.assign(new DiscordApiError("Discord API error", 30010), {
        code: 30010,
      }),
    );

    expect(
      await result(await react({ messageId: "123", emoji: "👍" })),
    ).toEqual({
      status: 400,
      body: { status: "error", error: "Discord allows 20 emoji per message" },
    });
  });
});
