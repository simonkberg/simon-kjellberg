// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addBotReaction,
  type Message,
  removeBotReaction,
} from "@/lib/discord/api";
import { notifySubscribers } from "@/lib/discord/gateway";
import { log } from "@/lib/log";
import type { Username } from "@/lib/session";
import { query } from "@/lib/turso";
import { createSqliteQuery } from "@/mocks/sqlite";

import { MIGRATIONS } from "./migrations";
import { toggleReaction, withSiteReactions } from "./reactions";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("@/lib/turso"), () => ({ query: vi.fn() }));
vi.mock(import("@/lib/discord/api"), () => ({
  addBotReaction: vi.fn(() => Promise.resolve()),
  removeBotReaction: vi.fn(() => Promise.resolve()),
}));
vi.mock(import("@/lib/discord/gateway"), () => ({
  notifySubscribers: vi.fn(),
}));

const alice = "alice" as Username;
const bob = "bob" as Username;

function message(id: string, overrides: Partial<Message> = {}): Message {
  return {
    id,
    user: { name: "someone", color: "hsl(0 0% 0%)" },
    content: "hi",
    edited: false,
    timestamp: new Date(0),
    reactions: [],
    replies: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(query).mockImplementation(createSqliteQuery(MIGRATIONS));
});

describe("toggleReaction", () => {
  it("adds a reaction, mirrors it on Discord and notifies subscribers", async () => {
    expect(await toggleReaction("1", "👍", alice)).toBe("added");

    expect(addBotReaction).toHaveBeenCalledWith("1", "👍");
    expect(notifySubscribers).toHaveBeenCalledOnce();
  });

  it("keeps the bot's reaction while other visitors still react", async () => {
    await toggleReaction("1", "👍", alice);
    await toggleReaction("1", "👍", bob);

    expect(await toggleReaction("1", "👍", alice)).toBe("removed");
    expect(removeBotReaction).not.toHaveBeenCalled();

    expect(await toggleReaction("1", "👍", bob)).toBe("removed");
    expect(removeBotReaction).toHaveBeenCalledWith("1", "👍");
  });

  it("still removes the reaction when Discord fails to drop the mirror", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    vi.mocked(removeBotReaction).mockRejectedValueOnce(new Error("down"));
    await toggleReaction("1", "👍", alice);

    expect(await toggleReaction("1", "👍", alice)).toBe("removed");
    expect(log.warn).toHaveBeenCalledOnce();
  });

  it("adds nothing when Discord turns the reaction away", async () => {
    vi.mocked(addBotReaction).mockRejectedValueOnce(new Error("404"));

    await expect(toggleReaction("1", "👍", alice)).rejects.toThrow("404");
    expect((await query("SELECT * FROM reactions")).rows).toEqual([]);
  });
});

describe("withSiteReactions", () => {
  it("adds the site's reactions to Discord's, replies included", async () => {
    await toggleReaction("1", "😂", alice);
    await toggleReaction("1", "👍", alice);
    await toggleReaction("1", "👍", bob);
    await toggleReaction("2", "🎉", bob);

    const messages = await withSiteReactions([
      message("1", {
        reactions: [{ emoji: "👍", count: 1, users: [] }],
        replies: [message("2")],
      }),
      message("3", { reactions: [{ emoji: "😮", count: 2, users: [] }] }),
    ]);

    expect(messages).toMatchObject([
      {
        id: "1",
        reactions: [
          { emoji: "👍", count: 3, users: ["alice", "bob"] },
          { emoji: "😂", count: 1, users: ["alice"] },
        ],
        replies: [
          { id: "2", reactions: [{ emoji: "🎉", count: 1, users: ["bob"] }] },
        ],
      },
      { id: "3", reactions: [{ emoji: "😮", count: 2, users: [] }] },
    ]);
  });

  it("falls back to Discord's reactions when Turso fails", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    vi.mocked(query).mockRejectedValueOnce(new Error("down"));
    const messages = [message("1")];

    expect(await withSiteReactions(messages)).toBe(messages);
    expect(log.error).toHaveBeenCalledOnce();
  });

  it("skips the query without messages", async () => {
    expect(await withSiteReactions([])).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
