// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addBotReaction,
  type Message,
  removeBotReaction,
} from "@/lib/discord/api";
import {
  notifySubscribers,
  subscribeToReactionClears,
} from "@/lib/discord/gateway";
import { log } from "@/lib/log";
import type { Username } from "@/lib/session";
import { query } from "@/lib/turso";
import { createSqliteQuery, emptyResult } from "@/mocks/sqlite";

import { REACTION_EMOJI } from "./emoji";
import { MIGRATIONS } from "./migrations";
import {
  addReaction,
  clearReactions,
  EmojiSchema,
  startReactionCleanup,
  toggleReaction,
  withSiteReactions,
} from "./reactions";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("@/lib/turso"), () => ({ query: vi.fn() }));
vi.mock(import("@/lib/discord/api"), () => ({
  addBotReaction: vi.fn(() => Promise.resolve()),
  removeBotReaction: vi.fn(() => Promise.resolve()),
}));
vi.mock(import("@/lib/discord/gateway"), () => ({
  notifySubscribers: vi.fn(),
  subscribeToReactionClears: vi.fn(() => () => {}),
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
  it("adds a reaction and mirrors it on Discord, whose echo refreshes the streams", async () => {
    expect(await toggleReaction("1", "👍", alice)).toBe("added");

    expect(addBotReaction).toHaveBeenCalledWith("1", "👍");
    expect(notifySubscribers).not.toHaveBeenCalled();
  });

  it("refreshes the streams itself when the mirror doesn't change", async () => {
    await toggleReaction("1", "👍", alice);

    await toggleReaction("1", "👍", bob);
    expect(notifySubscribers).toHaveBeenCalledOnce();

    await toggleReaction("1", "👍", bob);
    expect(notifySubscribers).toHaveBeenCalledTimes(2);

    await toggleReaction("1", "👍", alice);
    expect(removeBotReaction).toHaveBeenCalledWith("1", "👍");
    expect(notifySubscribers).toHaveBeenCalledTimes(2);
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

  it("still removes the reaction when counting the rest fails", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    await toggleReaction("1", "👍", alice);
    const sqlite = vi.mocked(query).getMockImplementation()!;
    vi.mocked(query)
      .mockImplementationOnce(sqlite)
      .mockRejectedValueOnce(new Error("blip"));

    expect(await toggleReaction("1", "👍", alice)).toBe("removed");
    expect(log.warn).toHaveBeenCalledOnce();
    expect(notifySubscribers).toHaveBeenCalledOnce();
  });

  it("restores the mirror when a reaction lands while it is dropped", async () => {
    await toggleReaction("1", "👍", alice);
    vi.mocked(addBotReaction).mockClear();
    vi.mocked(removeBotReaction).mockImplementationOnce(async () => {
      await query(
        "INSERT INTO reactions (message_id, emoji, username) VALUES ('1', '👍', 'bob')",
      );
    });

    expect(await toggleReaction("1", "👍", alice)).toBe("removed");
    expect(removeBotReaction).toHaveBeenCalledWith("1", "👍");
    expect(addBotReaction).toHaveBeenCalledWith("1", "👍");
  });

  it("keeps one reaction when the same one is added twice", async () => {
    await addReaction("1", "👍", alice);
    await addReaction("1", "👍", alice);

    expect((await query("SELECT * FROM reactions")).rows).toHaveLength(1);
    expect(addBotReaction).toHaveBeenCalledOnce();
  });

  it("adds nothing when Discord turns the reaction away", async () => {
    vi.mocked(addBotReaction).mockRejectedValueOnce(new Error("404"));

    await expect(toggleReaction("1", "👍", alice)).rejects.toThrow("404");
    expect((await query("SELECT * FROM reactions")).rows).toEqual([]);
  });

  it("reports Discord's error when the rollback fails too", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const sqlite = vi.mocked(query).getMockImplementation()!;
    vi.mocked(query)
      .mockImplementationOnce(sqlite)
      .mockImplementationOnce(sqlite)
      .mockImplementationOnce(sqlite)
      .mockRejectedValueOnce(new Error("blip"));
    vi.mocked(addBotReaction).mockRejectedValueOnce(new Error("404"));

    await expect(toggleReaction("1", "👍", alice)).rejects.toThrow("404");
    expect(log.error).toHaveBeenCalledOnce();
  });

  it("leaves the mirror to the concurrent add that created the row", async () => {
    await query(
      "INSERT INTO reactions (message_id, emoji, username) VALUES ('1', '👍', 'alice')",
    );
    // The concurrent request's row lands between this one's DELETE and INSERT.
    vi.mocked(query)
      .mockResolvedValueOnce(emptyResult)
      .mockResolvedValueOnce(emptyResult);

    expect(await toggleReaction("1", "👍", alice)).toBe("added");
    expect(addBotReaction).not.toHaveBeenCalled();
    expect((await query("SELECT * FROM reactions")).rows).toHaveLength(1);
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

describe("clearReactions", () => {
  it("drops one emoji's rows or all of a message's", async () => {
    await toggleReaction("1", "👍", alice);
    await toggleReaction("1", "😂", alice);
    await toggleReaction("2", "👍", bob);

    await clearReactions({ messageIds: ["1"], emoji: "👍" });
    expect(await withSiteReactions([message("1"), message("2")])).toMatchObject(
      [
        { id: "1", reactions: [{ emoji: "😂" }] },
        { id: "2", reactions: [{ emoji: "👍" }] },
      ],
    );

    await clearReactions({ messageIds: ["1"], emoji: null });
    expect(await withSiteReactions([message("1")])).toMatchObject([
      { id: "1", reactions: [] },
    ]);
  });

  it("drops several messages' rows at once", async () => {
    await toggleReaction("1", "👍", alice);
    await toggleReaction("2", "😂", bob);
    await toggleReaction("3", "🎉", bob);

    await clearReactions({ messageIds: ["1", "2"], emoji: null });

    expect(
      await withSiteReactions([message("1"), message("2"), message("3")]),
    ).toMatchObject([
      { reactions: [] },
      { reactions: [] },
      { reactions: [{ emoji: "🎉" }] },
    ]);
  });
});

describe("startReactionCleanup", () => {
  function startAndGetCallback() {
    startReactionCleanup();
    const callback = vi.mocked(subscribeToReactionClears).mock.calls[0]?.[0];
    if (!callback) throw new Error("not subscribed");
    return callback;
  }

  it("clears rows on Discord's clears, leaving the refresh to the gateway", async () => {
    await toggleReaction("1", "👍", alice);

    await startAndGetCallback()({ messageIds: ["1"], emoji: null });

    expect(notifySubscribers).not.toHaveBeenCalled();
    expect(await withSiteReactions([message("1")])).toMatchObject([
      { reactions: [] },
    ]);
  });

  it("logs a failed clear", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    vi.mocked(query).mockRejectedValueOnce(new Error("down"));

    await startAndGetCallback()({ messageIds: ["1"], emoji: "👍" });

    expect(log.error).toHaveBeenCalledOnce();
  });
});

describe("EmojiSchema", () => {
  it.each([...REACTION_EMOJI.map(({ emoji }) => emoji), "👍🏽", "🏳️‍🌈", "1️⃣"])(
    "accepts %s",
    (emoji) => {
      expect(EmojiSchema.safeParse(emoji).success).toBe(true);
    },
  );

  it.each(["", "a", "👍👍", "👍 ", ":joy:"])("rejects %j", (text) => {
    expect(EmojiSchema.safeParse(text).success).toBe(false);
  });
});
