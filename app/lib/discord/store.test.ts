import { afterEach, describe, expect, it, vi } from "vitest";

import { log } from "@/lib/log";
import { mockEnv } from "@/mocks/env";

import type { DiscordMessage } from "./schemas";
import { ChannelStore, type StoreSource, WINDOW } from "./store";

vi.mock(import("server-only"), () => ({}));

const CHANNEL = mockEnv.DISCORD_CHANNEL_ID;
const BOT = "bot-user-id";
const SMILE = { id: null, name: "😄" };

function message(id: string, overrides: Partial<DiscordMessage> = {}) {
  return {
    type: 0,
    id,
    author: { id: "user-1", username: "user1" },
    content: `message ${id}`,
    timestamp: "2025-01-01T00:00:00.000000+00:00",
    edited_timestamp: null,
    ...overrides,
  } satisfies DiscordMessage;
}

function createStore(messages: DiscordMessage[] = [message("1")]) {
  const source = {
    fetchMessages: vi.fn<StoreSource["fetchMessages"]>(async () => messages),
    fetchMessage: vi.fn<StoreSource["fetchMessage"]>(async (id) => message(id)),
    fetchReactorIds: vi.fn<StoreSource["fetchReactorIds"]>(async () => []),
    fetchMemberName: vi.fn<StoreSource["fetchMemberName"]>(
      async (id) => `member ${id}`,
    ),
    botUserId: () => BOT,
  };
  return { store: new ChannelStore(source), source };
}

function reacted(id: string) {
  return message(id, { reactions: [{ count: 1, me: false, emoji: SMILE }] });
}

async function stored(store: ChannelStore, id: string) {
  return (await store.messages()).find((m) => m.id === id);
}

function react(
  t: "MESSAGE_REACTION_ADD" | "MESSAGE_REACTION_REMOVE",
  userId: string,
  messageId = "1",
  emoji: { id: string | null; name: string | null } = SMILE,
) {
  const d = {
    channel_id: CHANNEL,
    message_id: messageId,
    user_id: userId,
    emoji,
  };
  return t === "MESSAGE_REACTION_ADD"
    ? ({ t, d: { ...d, member: { user: { username: userId } } } } as const)
    : ({ t, d } as const);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ChannelStore", () => {
  it("should seed once and answer from memory after", async () => {
    const { store, source } = createStore();

    await store.messages();
    await store.messages();

    expect(source.fetchMessages).toHaveBeenCalledOnce();
  });

  it("should tell listeners when a seed lands and after each event, not before", async () => {
    const { store, source } = createStore();
    const first = Promise.withResolvers<DiscordMessage[]>();
    source.fetchMessages.mockReturnValueOnce(first.promise);
    const listener = vi.fn();
    store.listen(listener);

    const messages = store.messages();
    store.apply({ t: "READY" });
    expect(listener).not.toHaveBeenCalled();
    first.resolve([message("1")]);
    await messages;
    expect(listener).toHaveBeenCalledOnce();

    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "1" } });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("should tell listeners about events before any seed has landed", async () => {
    const { store, source } = createStore();
    source.fetchMessages.mockRejectedValueOnce(new Error("down"));
    const listener = vi.fn();
    store.listen(listener);
    await expect(store.messages()).rejects.toThrow("down");

    store.apply({
      t: "MESSAGE_CREATE",
      d: { ...message("2"), channel_id: CHANNEL },
    });

    expect(listener).toHaveBeenCalledOnce();
    expect(await store.messages()).toMatchObject([{ id: "1" }]);
  });

  it("should log a throwing listener and still tell the rest", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const { store } = createStore();
    const listener = vi.fn();
    store.listen(() => {
      throw new Error("boom");
    });
    store.listen(listener);

    await store.messages();

    expect(listener).toHaveBeenCalledOnce();
    expect(log.error).toHaveBeenCalledOnce();
  });

  it("should leave out messages the site doesn't show", async () => {
    const { store } = createStore([message("1"), message("2", { type: 7 })]);

    expect(await store.messages()).toMatchObject([{ id: "1" }]);
  });

  it("should seed again on a new session and keep serving meanwhile", async () => {
    const { store, source } = createStore();
    await store.messages();
    source.fetchMessages.mockResolvedValueOnce([message("1"), message("2")]);

    store.apply({ t: "READY" });
    expect(await store.messages()).toHaveLength(1);
    await vi.waitFor(async () => {
      expect(await store.messages()).toHaveLength(2);
    });
  });

  it("should seed again when an event lands mid-seed", async () => {
    const { store, source } = createStore();
    const first = Promise.withResolvers<DiscordMessage[]>();
    source.fetchMessages.mockReturnValueOnce(first.promise);

    const messages = store.messages();
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "1" } });
    first.resolve([message("1")]);

    await messages;
    expect(source.fetchMessages).toHaveBeenCalledTimes(2);
  });

  it("should seed again when a new session starts mid-seed", async () => {
    const { store, source } = createStore();
    await store.messages();
    const first = Promise.withResolvers<DiscordMessage[]>();
    source.fetchMessages.mockReturnValueOnce(first.promise);
    source.fetchMessages.mockResolvedValueOnce([message("1"), message("2")]);

    store.apply({ t: "READY" });
    store.apply({ t: "READY" });
    first.resolve([message("1")]);

    await vi.waitFor(() => {
      expect(source.fetchMessages).toHaveBeenCalledTimes(3);
    });
    await vi.waitFor(async () => {
      expect(await store.messages()).toHaveLength(2);
    });
    expect(source.fetchMessages).toHaveBeenCalledTimes(3);
  });

  it("should give up seeding again after a few attempts and retry later", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    const { store, source } = createStore();
    source.fetchMessages.mockImplementation(async () => {
      store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "x" } });
      return [message("1")];
    });

    expect(await store.messages()).toHaveLength(1);
    expect(source.fetchMessages).toHaveBeenCalledTimes(3);
    expect(log.warn).toHaveBeenCalledOnce();

    source.fetchMessages.mockResolvedValue([message("1"), message("2")]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await store.messages()).toHaveLength(2);
  });

  it("should keep the live window when a reseed gives up", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    const { store, source } = createStore();
    await store.messages();
    const listener = vi.fn();
    store.listen(listener);
    source.fetchMessages.mockImplementation(async () => {
      store.apply({
        t: "MESSAGE_CREATE",
        d: { ...message("2"), channel_id: CHANNEL },
      });
      return [message("1")];
    });

    store.apply({ t: "READY" });
    await vi.advanceTimersByTimeAsync(0);

    expect(source.fetchMessages).toHaveBeenCalledTimes(4);
    expect(await store.messages()).toMatchObject([{ id: "1" }, { id: "2" }]);
    expect(listener).toHaveBeenCalledTimes(3);

    source.fetchMessages.mockResolvedValue([message("1"), message("2")]);
    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    source.fetchReactorIds.mockResolvedValue(["user-2", "user-3"]);
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2", "user-3"]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(source.fetchMessages).toHaveBeenCalledTimes(5);
  });

  it("should seed again after a failed or changing reseed until one lands", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    vi.spyOn(log, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    const { store, source } = createStore();
    await store.messages();
    const listener = vi.fn();
    store.listen(listener);

    source.fetchMessages.mockRejectedValueOnce(new Error("down"));
    store.apply({ t: "READY" });
    await vi.advanceTimersByTimeAsync(0);
    expect(log.error).toHaveBeenCalledOnce();

    source.fetchMessages.mockImplementation(async () => {
      store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "x" } });
      return [message("1")];
    });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(log.warn).toHaveBeenCalledOnce();
    listener.mockClear();

    source.fetchMessages.mockResolvedValue([message("1"), message("2")]);
    const calls = source.fetchMessages.mock.calls.length;
    await store.messages();
    expect(source.fetchMessages).toHaveBeenCalledTimes(calls);
    // Each retry waits twice as long as the last.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(source.fetchMessages).toHaveBeenCalledTimes(calls);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await store.messages()).toHaveLength(2);
    expect(listener).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(source.fetchMessages).toHaveBeenCalledTimes(calls + 1);

    source.fetchMessages.mockRejectedValueOnce(new Error("down"));
    store.apply({ t: "MISSED" });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(source.fetchMessages).toHaveBeenCalledTimes(calls + 3);
  });

  it("should not count a reaction twice when the seed already holds it", async () => {
    const { store } = createStore([
      message("1", { reactions: [{ count: 2, me: true, emoji: SMILE }] }),
    ]);
    await store.messages();
    await store.reactorIds("1", "😄");

    store.apply(react("MESSAGE_REACTION_ADD", BOT));
    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));

    expect((await stored(store, "1"))?.reactions).toMatchObject([
      { count: 3, me: true },
    ]);
    store.apply(react("MESSAGE_REACTION_REMOVE", BOT));
    store.apply(react("MESSAGE_REACTION_REMOVE", BOT));
    store.apply(
      react("MESSAGE_REACTION_ADD", BOT, "1", { id: null, name: "👍" }),
    );
    expect((await stored(store, "1"))?.reactions).toMatchObject([
      { count: 2, me: false },
      { count: 1, me: true },
    ]);
  });

  it("should keep a name an event learned when an earlier lookup fails", async () => {
    const { store, source } = createStore();
    const lookup = Promise.withResolvers<string | undefined>();
    source.fetchMemberName.mockReturnValueOnce(lookup.promise);
    await store.messages();

    const failed = store.memberName("user-2");
    store.apply({
      t: "MESSAGE_CREATE",
      d: {
        ...message("2", { author: { id: "user-2", username: "user2" } }),
        channel_id: CHANNEL,
        member: { nick: "Nick" },
      },
    });
    lookup.reject(new Error("down"));
    await expect(failed).rejects.toThrow("down");

    expect(await store.memberName("user-2")).toBe("Nick");
    expect(source.fetchMemberName).toHaveBeenCalledOnce();
  });

  it("should seed again after an event it couldn't read, keeping names", async () => {
    const { store, source } = createStore();
    await store.messages();
    await store.memberName("user-2");
    source.fetchMessages.mockResolvedValueOnce([message("1"), message("2")]);

    store.apply({ t: "MISSED" });

    await vi.waitFor(async () => {
      expect(await store.messages()).toHaveLength(2);
    });
    await store.memberName("user-2");
    expect(source.fetchMemberName).toHaveBeenCalledOnce();
  });

  it("should forget names learned in an earlier session", async () => {
    const { store, source } = createStore();
    await store.messages();
    await store.memberName("user-2");

    store.apply({ t: "READY" });
    await vi.waitFor(() => {
      expect(source.fetchMessages).toHaveBeenCalledTimes(2);
    });
    await store.memberName("user-2");

    expect(source.fetchMemberName).toHaveBeenCalledTimes(2);
  });

  it("should keep a newer reactor fetch when an older one fails", async () => {
    const { store, source } = createStore([
      message("1", { reactions: [{ count: 2, me: false, emoji: SMILE }] }),
    ]);
    const first = Promise.withResolvers<string[]>();
    const second = Promise.withResolvers<string[]>();
    source.fetchReactorIds
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    await store.messages();

    const failed = store.reactorIds("1", "😄");
    store.apply(react("MESSAGE_REACTION_REMOVE", "user-2"));
    const ids = store.reactorIds("1", "😄");
    first.reject(new Error("down"));
    await expect(failed).rejects.toThrow("down");
    const again = store.reactorIds("1", "😄");
    second.resolve(["user-3"]);

    expect(await ids).toEqual(["user-3"]);
    expect(await again).toEqual(["user-3"]);
    expect(source.fetchReactorIds).toHaveBeenCalledTimes(2);
  });

  it("should drop reactor fetches when every reaction is cleared", async () => {
    const { store, source } = createStore([reacted("1")]);
    const fetch = Promise.withResolvers<string[]>();
    source.fetchReactorIds.mockReturnValueOnce(fetch.promise);
    await store.messages();

    const ids = store.reactorIds("1", "😄");
    store.apply({
      t: "MESSAGE_REACTION_REMOVE_ALL",
      d: { channel_id: CHANNEL, message_id: "1" },
    });
    fetch.resolve(["user-2"]);
    await ids;
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));

    expect(await store.reactorIds("1", "😄")).toEqual(["user-3"]);
  });

  it("should find older messages once and drop them when an event changes them", async () => {
    const { store, source } = createStore();
    await store.messages();

    expect(await store.find("1")).toMatchObject({ id: "1" });
    expect(await store.find("old")).toMatchObject({ id: "old" });
    await store.find("old");
    expect(source.fetchMessage).toHaveBeenCalledOnce();

    store.apply({
      t: "MESSAGE_UPDATE",
      d: { channel_id: CHANNEL, id: "old", content: "edited" },
    });
    await store.find("old");
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "old" } });
    await store.find("old");
    store.apply({
      t: "MESSAGE_DELETE_BULK",
      d: { channel_id: CHANNEL, ids: ["old"] },
    });
    await store.find("old");
    expect(source.fetchMessage).toHaveBeenCalledTimes(4);
  });

  it("should fetch an older message again after a failure", async () => {
    const { store, source } = createStore();
    source.fetchMessage.mockRejectedValueOnce(new Error("down"));

    await expect(store.find("old")).rejects.toThrow("down");
    expect(await store.find("old")).toMatchObject({ id: "old" });
  });

  it("should keep a newer fetch of an older message when an earlier one fails", async () => {
    const { store, source } = createStore();
    const first = Promise.withResolvers<DiscordMessage>();
    source.fetchMessage.mockReturnValueOnce(first.promise);

    const failed = store.find("old");
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "old" } });
    await store.find("old");
    first.reject(new Error("down"));
    await expect(failed).rejects.toThrow("down");
    await store.find("old");

    expect(source.fetchMessage).toHaveBeenCalledTimes(2);
  });

  it("should not keep who reacted to a message outside the window", async () => {
    const { store, source } = createStore();
    source.fetchReactorIds.mockResolvedValue(["user-2"]);
    await store.messages();

    expect(await store.reactorIds("old", "😄")).toEqual(["user-2"]);
    await store.reactorIds("old", "😄");
    expect(source.fetchReactorIds).toHaveBeenCalledTimes(2);
  });

  it("should only drop the cleared message's reactor fetches", async () => {
    const reactions = [{ count: 1, me: false, emoji: SMILE }];
    const { store, source } = createStore([
      message("1", { reactions }),
      message("2", { reactions }),
    ]);
    source.fetchReactorIds.mockResolvedValue(["user-2"]);
    await store.messages();

    const ids = [store.reactorIds("1", "😄"), store.reactorIds("2", "😄")];
    store.apply({
      t: "MESSAGE_REACTION_REMOVE_ALL",
      d: { channel_id: CHANNEL, message_id: "1" },
    });
    await Promise.all(ids);
    await store.reactorIds("2", "😄");

    expect(source.fetchReactorIds).toHaveBeenCalledTimes(3);
  });

  it("should count a reaction beside others and skip a nameless reactor", async () => {
    const { store, source } = createStore([
      message("1", {
        reactions: [
          { count: 1, me: false, emoji: { id: null, name: "👍" } },
          { count: 1, me: false, emoji: SMILE },
        ],
      }),
    ]);
    await store.messages();

    store.apply({
      t: "MESSAGE_REACTION_ADD",
      d: {
        ...react("MESSAGE_REACTION_ADD", "nameless").d,
        member: { user: {} },
      },
    });
    await store.memberName("nameless");

    expect((await stored(store, "1"))?.reactions).toMatchObject([
      { count: 1 },
      { count: 2 },
    ]);
    expect(source.fetchMemberName).toHaveBeenCalledOnce();
  });

  it("should hand back who reacted as an event settled it mid-fetch", async () => {
    const { store, source } = createStore([reacted("1")]);
    const fetch = Promise.withResolvers<string[]>();
    source.fetchReactorIds.mockReturnValueOnce(fetch.promise);
    await store.messages();

    const ids = store.reactorIds("1", "😄");
    store.apply(react("MESSAGE_REACTION_REMOVE", "user-2"));
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));
    fetch.resolve(["user-2"]);

    expect(await ids).toEqual(["user-3"]);
  });

  it("should retry a failed seed on the next read", async () => {
    const { store, source } = createStore();
    source.fetchMessages.mockRejectedValueOnce(new Error("down"));

    await expect(store.messages()).rejects.toThrow("down");
    expect(await store.messages()).toHaveLength(1);
  });

  it("should add, edit and delete messages", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_CREATE",
      d: { ...message("2"), channel_id: CHANNEL },
    });
    store.apply({
      t: "MESSAGE_UPDATE",
      d: {
        id: "1",
        channel_id: CHANNEL,
        content: "edited",
        author: { id: "user-1" },
      },
    });
    store.apply({
      t: "MESSAGE_CREATE",
      d: { ...message("3", { type: 7 }), channel_id: CHANNEL },
    });

    expect(await store.messages()).toMatchObject([
      {
        id: "1",
        content: "edited",
        author: { id: "user-1", username: "user1" },
      },
      { id: "2" },
    ]);

    store.apply({
      t: "MESSAGE_DELETE_BULK",
      d: { channel_id: CHANNEL, ids: ["1", "2"] },
    });
    expect(await store.messages()).toEqual([]);
  });

  it("should refill the window once after a burst of deletes", async () => {
    vi.useFakeTimers();
    const { store, source } = createStore([
      message("1"),
      message("2"),
      message("3"),
    ]);
    await store.messages();
    source.fetchMessages.mockResolvedValue([message("0"), message("3")]);

    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "x" } });
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "1" } });
    await vi.advanceTimersByTimeAsync(5_000);
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "2" } });
    expect(await store.messages()).toMatchObject([{ id: "3" }]);
    expect(source.fetchMessages).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(await store.messages()).toMatchObject([{ id: "0" }, { id: "3" }]);
    expect(source.fetchMessages).toHaveBeenCalledTimes(2);
  });

  it("should keep what it knows across a refill where the counts agree", async () => {
    const { store, source } = createStore([
      reacted("1"),
      message("2", { reactions: [{ count: 1, me: false, emoji: SMILE }] }),
      message("3"),
    ]);
    source.fetchReactorIds.mockResolvedValue(["user-2"]);
    await store.messages();
    await store.reactorIds("1", "😄");
    await store.reactorIds("2", "😄");
    await store.find("old");
    source.fetchMessages.mockResolvedValue([
      reacted("1"),
      message("2", { reactions: [{ count: 2, me: false, emoji: SMILE }] }),
    ]);

    vi.useFakeTimers();
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "3" } });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(source.fetchMessages).toHaveBeenCalledTimes(2);

    await store.reactorIds("1", "😄");
    await store.reactorIds("2", "😄");
    await store.find("old");
    expect(source.fetchReactorIds).toHaveBeenCalledTimes(3);
    expect(source.fetchMessage).toHaveBeenCalledOnce();
  });

  it("should forget who reacted and older messages on a new session", async () => {
    const { store, source } = createStore([reacted("1")]);
    await store.messages();
    await store.reactorIds("1", "😄");
    await store.find("old");

    store.apply({ t: "READY" });
    await vi.waitFor(() => {
      expect(source.fetchMessages).toHaveBeenCalledTimes(2);
    });

    await store.reactorIds("1", "😄");
    await store.find("old");
    expect(source.fetchReactorIds).toHaveBeenCalledTimes(2);
    expect(source.fetchMessage).toHaveBeenCalledTimes(2);
  });

  it("should ignore an update for a message outside the window", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_UPDATE",
      d: { id: "old", channel_id: CHANNEL, content: "edited" },
    });

    expect(await stored(store, "old")).toBeUndefined();
  });

  it("should keep only the latest messages", async () => {
    const seed = Array.from({ length: WINDOW }, (_, i) => message(`${i}`));
    const { store } = createStore(seed);
    await store.messages();

    store.apply({
      t: "MESSAGE_CREATE",
      d: { ...message("new"), channel_id: CHANNEL },
    });

    const messages = await store.messages();
    expect(messages).toHaveLength(WINDOW);
    expect(messages[0]?.id).toBe("1");
    expect(messages.at(-1)?.id).toBe("new");
  });

  it("should count reactions and track the bot's mirror", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    store.apply(react("MESSAGE_REACTION_ADD", BOT));
    expect((await stored(store, "1"))?.reactions).toEqual([
      { count: 2, me: true, emoji: SMILE },
    ]);
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2"]);

    store.apply(react("MESSAGE_REACTION_REMOVE", BOT));
    store.apply(react("MESSAGE_REACTION_REMOVE", "user-2"));
    expect((await stored(store, "1"))?.reactions).toEqual([]);
  });

  it("should share one fetch of who reacted, and skip it for a deleted message", async () => {
    const { store, source } = createStore([reacted("1")]);
    const fetch = Promise.withResolvers<string[]>();
    source.fetchReactorIds.mockReturnValueOnce(fetch.promise);
    await store.messages();

    source.fetchMessages.mockResolvedValue([]);

    const first = store.reactorIds("1", "😄");
    const second = store.reactorIds("1", "😄");
    store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "1" } });
    fetch.resolve(["user-2"]);

    expect(await first).toEqual(["user-2"]);
    expect(await second).toEqual(["user-2"]);
    expect(source.fetchReactorIds).toHaveBeenCalledOnce();
  });

  it("should fetch who reacted again after a failure", async () => {
    const { store, source } = createStore([reacted("1")]);
    source.fetchReactorIds
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue(["user-2"]);
    await store.messages();

    await expect(store.reactorIds("1", "😄")).rejects.toThrow("down");
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2"]);
  });

  it("should ignore events for messages it doesn't hold or emoji it can't show", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_REACTION_REMOVE_ALL",
      d: { channel_id: CHANNEL, message_id: "old" },
    });
    store.apply({
      t: "MESSAGE_REACTION_REMOVE_EMOJI",
      d: {
        channel_id: CHANNEL,
        message_id: "1",
        emoji: { id: "9", name: null },
      },
    });
    store.apply({
      t: "MESSAGE_REACTION_REMOVE_EMOJI",
      d: { channel_id: CHANNEL, message_id: "1", emoji: SMILE },
    });

    expect((await stored(store, "1"))?.reactions).toEqual([]);
    expect(await stored(store, "old")).toBeUndefined();
  });

  it("should not learn names from the bot's posts or nameless authors", async () => {
    const { store, source } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_CREATE",
      d: {
        ...message("2", { author: { id: BOT, bot: true, username: "bot" } }),
        channel_id: CHANNEL,
      },
    });
    store.apply({
      t: "MESSAGE_CREATE",
      d: { ...message("3", { author: { id: "user-4" } }), channel_id: CHANNEL },
    });

    await store.memberName(BOT);
    await store.memberName("user-4");
    expect(source.fetchMemberName).toHaveBeenCalledTimes(2);
  });

  it("should leave other bots out of who reacted, as REST does", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_REACTION_ADD",
      d: {
        ...react("MESSAGE_REACTION_ADD", "other-bot").d,
        member: { user: { bot: true, username: "b" } },
      },
    });

    expect((await stored(store, "1"))?.reactions).toMatchObject([{ count: 1 }]);
    expect(await store.reactorIds("1", "😄")).toEqual([]);
  });

  it("should fetch who reacted when a reaction comes without member data", async () => {
    const { store, source } = createStore();
    await store.messages();
    source.fetchReactorIds.mockResolvedValue(["user-2"]);

    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    store.apply({
      t: "MESSAGE_REACTION_ADD",
      d: react("MESSAGE_REACTION_REMOVE", "maybe-bot").d,
    });

    expect((await stored(store, "1"))?.reactions).toMatchObject([{ count: 2 }]);
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2"]);
    expect(source.fetchReactorIds).toHaveBeenCalledOnce();
  });

  it("should keep a looked-up name over an event without member data", async () => {
    const { store, source } = createStore();
    await store.messages();
    await store.memberName("user-2");

    store.apply({
      t: "MESSAGE_CREATE",
      d: {
        ...message("2", { author: { id: "user-2", username: "two" } }),
        channel_id: CHANNEL,
      },
    });

    expect(await store.memberName("user-2")).toBe("member user-2");
    expect(source.fetchMemberName).toHaveBeenCalledOnce();
  });

  it("should drop someone who takes their reaction back", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));
    store.apply(react("MESSAGE_REACTION_REMOVE", "user-2"));

    expect((await stored(store, "1"))?.reactions).toEqual([
      { count: 1, me: false, emoji: SMILE },
    ]);
    expect(await store.reactorIds("1", "😄")).toEqual(["user-3"]);
  });

  it("should log a reseed that fails and keep what it has", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const { store, source } = createStore();
    await store.messages();
    source.fetchMessages.mockRejectedValueOnce(new Error("down"));

    store.apply({ t: "READY" });

    await vi.waitFor(() => {
      expect(log.error).toHaveBeenCalledWith(
        { err: new Error("down") },
        "Failed to seed the channel store",
      );
    });
    expect(await store.messages()).toHaveLength(1);
  });

  it("should ignore custom emoji and reactions outside the window", async () => {
    const { store } = createStore();
    await store.messages();

    store.apply(
      react("MESSAGE_REACTION_ADD", "user-2", "1", { id: "9", name: "x" }),
    );
    store.apply(react("MESSAGE_REACTION_ADD", "user-2", "old"));
    store.apply(react("MESSAGE_REACTION_REMOVE", "user-2"));

    expect((await stored(store, "1"))?.reactions).toBeUndefined();
  });

  it("should fetch who reacted to a seeded reaction once, then follow events", async () => {
    const { store, source } = createStore([reacted("1")]);
    source.fetchReactorIds.mockResolvedValue(["user-2"]);
    await store.messages();

    expect(await store.reactorIds("1", "😄")).toEqual(["user-2"]);
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2", "user-3"]);
    expect(source.fetchReactorIds).toHaveBeenCalledOnce();
  });

  it("should keep the first fetch's reactors when fetching again fails", async () => {
    const { store, source } = createStore([reacted("1")]);
    const first = Promise.withResolvers<string[]>();
    source.fetchReactorIds
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error("down"));
    await store.messages();

    const ids = store.reactorIds("1", "😄");
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));
    first.resolve(["user-2"]);

    expect(await ids).toEqual(["user-2"]);
  });

  it("should fetch who reacted to a new reaction while the window may have missed events", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    const { store, source } = createStore();
    source.fetchMessages.mockImplementation(async () => {
      store.apply({ t: "MESSAGE_DELETE", d: { channel_id: CHANNEL, id: "x" } });
      return [message("1")];
    });
    source.fetchReactorIds.mockResolvedValue(["user-2", "user-3"]);
    await store.messages();

    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));

    expect(await store.reactorIds("1", "😄")).toEqual(["user-2", "user-3"]);
  });

  it("should fetch who reacted again when an event makes a fetch stale", async () => {
    const { store, source } = createStore([reacted("1")]);
    const first = Promise.withResolvers<string[]>();
    source.fetchReactorIds
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(["user-2", "user-3"]);
    await store.messages();

    const stale = store.reactorIds("1", "😄");
    store.apply(react("MESSAGE_REACTION_ADD", "user-3"));
    first.resolve(["user-2"]);

    expect(await stale).toEqual(["user-2", "user-3"]);
    expect(await store.reactorIds("1", "😄")).toEqual(["user-2", "user-3"]);
    expect(source.fetchReactorIds).toHaveBeenCalledTimes(2);
  });

  it("should clear reactions by message and by emoji", async () => {
    const { store } = createStore();
    await store.messages();
    store.apply(react("MESSAGE_REACTION_ADD", "user-2"));
    store.apply(
      react("MESSAGE_REACTION_ADD", "user-2", "1", { id: null, name: "🎉" }),
    );

    store.apply({
      t: "MESSAGE_REACTION_REMOVE_EMOJI",
      d: { channel_id: CHANNEL, message_id: "1", emoji: SMILE },
    });
    expect((await stored(store, "1"))?.reactions).toMatchObject([
      { emoji: { name: "🎉" } },
    ]);

    store.apply({
      t: "MESSAGE_REACTION_REMOVE_ALL",
      d: { channel_id: CHANNEL, message_id: "1" },
    });
    expect((await stored(store, "1"))?.reactions).toEqual([]);
  });

  it("should learn names from events instead of asking", async () => {
    const { store, source } = createStore();
    await store.messages();

    store.apply({
      t: "MESSAGE_CREATE",
      d: {
        ...message("2", { author: { id: "user-2", global_name: "Two" } }),
        channel_id: CHANNEL,
        member: { nick: "Nick" },
      },
    });
    store.apply({
      t: "MESSAGE_REACTION_ADD",
      d: {
        ...react("MESSAGE_REACTION_ADD", "user-3").d,
        member: { nick: null, user: { username: "three" } },
      },
    });

    expect(await store.memberName("user-2")).toBe("Nick");
    expect(await store.memberName("user-3")).toBe("three");
    expect(source.fetchMemberName).not.toHaveBeenCalled();
  });

  it("should ask for a name once, and again only after a failure", async () => {
    const { store, source } = createStore();
    source.fetchMemberName.mockRejectedValueOnce(new Error("down"));

    await expect(store.memberName("user-2")).rejects.toThrow("down");
    expect(await store.memberName("user-2")).toBe("member user-2");
    expect(await store.memberName("user-2")).toBe("member user-2");
    expect(source.fetchMemberName).toHaveBeenCalledTimes(2);
  });
});
