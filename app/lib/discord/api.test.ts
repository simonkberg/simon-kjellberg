import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetGlobal } from "@/lib/global";
import { log } from "@/lib/log";
import type { Username } from "@/lib/session";
import { server } from "@/mocks/node";

import {
  _resetRateLimitState,
  _setRateLimitGate,
  addBotReaction,
  getChannelMessages,
  getMessageChain,
  postChannelMessage,
  removeBotReaction,
  searchChannelMessages,
  subscribeToChannel,
} from "./api";
import { connect, subscribe } from "./gateway";
import type { DiscordMessage } from "./schemas";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("./gateway"), () => ({
  connect: vi.fn(async () => {}),
  subscribe: vi.fn(async () => () => {}),
  getBotUserId: () => "bot-user-id",
}));

beforeEach(() => {
  resetGlobal("simon.dev/discord-store");
});

const DISCORD_BASE_URL = "https://discord.com/api/v10";
const MESSAGES_URL = `${DISCORD_BASE_URL}/channels/:channelId/messages`;
const REACTIONS_URL = `${MESSAGES_URL}/:messageId/reactions/:emoji`;
const BOT_REACTION_URL = `${REACTIONS_URL}/@me`;
const BOT_REACTION_ROUTE =
  "/channels/{channel.id}/messages/{message.id}/reactions/{emoji}/@me";
const MEMBER_URL = `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`;

function member(username: string, nick: string | null = null) {
  return HttpResponse.json({ user: { username, global_name: null }, nick });
}

function goneMember() {
  return HttpResponse.json(
    { message: "Unknown Member", code: 10007 },
    { status: 404 },
  );
}

function rateLimited(retryAfter: number, global = false) {
  return HttpResponse.json(
    { message: "Rate limited", retry_after: retryAfter, global },
    { status: 429 },
  );
}

function htmlRateLimited(headers?: Record<string, string>) {
  return HttpResponse.html("<html>Too Many Requests</html>", {
    status: 429,
    headers,
  });
}

const noContent = () => new HttpResponse(null, { status: 204 });
const emptyList = () => HttpResponse.json([]);

// Answers the first `times` requests with `first`, and every later one with `rest`.
function onceThen(first: () => Response, rest: () => Response, times = 1) {
  const handler = vi.fn(() =>
    handler.mock.calls.length <= times ? first() : rest(),
  );
  return handler;
}

function rawMessage(
  reactions: DiscordMessage["reactions"],
  id = "1",
): DiscordMessage {
  return {
    type: 0,
    id,
    author: { id: "user1", bot: true },
    content: "User: Hi",
    timestamp: "2025-01-01T00:00:00.000000+00:00",
    edited_timestamp: null,
    reactions,
  };
}

describe("getChannelMessages", () => {
  it("should fetch and parse messages successfully", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "TestUser: Hello world",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([
      {
        id: "1",
        content: "Hello world",
        edited: false,
        user: { name: "TestUser" },
      },
    ]);
  });

  it("should parse prefixed message with empty content", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "TestUser:",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([
      { id: "1", content: "", user: { name: "TestUser" } },
    ]);
  });

  it("should leave markdown in content untouched", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "TestUser: **Bold** and *italic*",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ content: "**Bold** and *italic*" }]);
  });

  it("should not parse username prefix from non-bot messages", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "human-user" },
            content: "the source is here: https://github.com/example/repo",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`,
        ({ params }) => {
          expect(params["userId"]).toBe("human-user");
          return HttpResponse.json({
            user: { username: "simon", global_name: "Simon" },
            nick: "simon",
          });
        },
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([
      {
        id: "1",
        content: "the source is here: https://github.com/example/repo",
        user: { name: "simon" },
      },
    ]);
  });

  it("should lookup user via guild member API when no prefix", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user123" },
            content: "No prefix here",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`,
        ({ params }) => {
          expect(params["userId"]).toBe("user123");
          return HttpResponse.json({
            user: { username: "discorduser", global_name: "Discord User" },
            nick: "Server Nick",
          });
        },
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([
      { content: "No prefix here", user: { name: "Server Nick" } },
    ]);
  });

  it("should use global_name when nick is null", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user456" },
            content: "Message",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
      http.get(`${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`, () =>
        HttpResponse.json({
          user: { username: "discorduser", global_name: "Global Name" },
          nick: null,
        }),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ user: { name: "Global Name" } }]);
  });

  it("should use username when nick and global_name are null", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user789" },
            content: "Message",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
      http.get(`${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`, () =>
        HttpResponse.json({
          user: { username: "fallbackuser", global_name: null },
          nick: null,
        }),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ user: { name: "fallbackuser" } }]);
  });

  it("should handle edited messages", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "User: Edited message",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: "2024-01-01T00:00:00Z",
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ edited: true }]);
  });

  it("should count Discord reactions other than the bot's own mirror", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage([
            { count: 3, me: true, emoji: { id: null, name: "👍" } },
            { count: 1, me: true, emoji: { id: null, name: "🎉" } },
            { count: 2, me: false, emoji: { id: null, name: "😂" } },
            { count: 1, me: false, emoji: { id: "42", name: "custom" } },
          ]),
        ]),
      ),
      http.get(REACTIONS_URL, ({ params }) =>
        HttpResponse.json(
          params["emoji"] === "👍"
            ? [
                { id: "reactor-1" },
                { id: "reactor-2" },
                { id: "bot", bot: true },
              ]
            : [{ id: "reactor-1" }, { id: "reactor-2" }],
        ),
      ),
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`,
        ({ params }) =>
          HttpResponse.json({
            user: { username: String(params["userId"]), global_name: null },
            nick: params["userId"] === "reactor-1" ? "simon" : null,
          }),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages[0]?.reactions).toEqual([
      { emoji: "👍", count: 2, users: ["simon", "reactor-2"] },
      { emoji: "😂", count: 2, users: ["simon", "reactor-2"] },
    ]);
  });

  it("should page through every Discord reactor", async () => {
    const page = Array.from({ length: 100 }, (_, i) => ({ id: `r${i}` }));
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage(
            [{ count: 101, me: false, emoji: { id: null, name: "😂" } }],
            "many-reactors",
          ),
        ]),
      ),
      http.get(REACTIONS_URL, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get("after") === "r99"
            ? [{ id: "r100" }]
            : page,
        ),
      ),
      http.get(MEMBER_URL, ({ params }) => member(String(params["userId"]))),
    );

    const messages = await getChannelMessages();

    expect(messages[0]?.reactions?.[0]?.users).toHaveLength(101);
    expect(messages[0]?.reactions?.[0]?.users.at(-1)).toBe("r100");
  });

  it("should skip Discord reactors who left the server", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage(
            [{ count: 2, me: false, emoji: { id: null, name: "😂" } }],
            "reactors-left",
          ),
        ]),
      ),
      http.get(REACTIONS_URL, () =>
        HttpResponse.json([{ id: "reactor-stays" }, { id: "reactor-left" }]),
      ),
      http.get(MEMBER_URL, ({ params }) =>
        params["userId"] === "reactor-left" ? goneMember() : member("stays"),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages[0]?.reactions).toEqual([
      { emoji: "😂", count: 2, users: ["stays"] },
    ]);
  });

  it("should keep the reactors it could name when one lookup fails", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage(
            [{ count: 2, me: false, emoji: { id: null, name: "😂" } }],
            "reactor-fails",
          ),
        ]),
      ),
      http.get(REACTIONS_URL, () =>
        HttpResponse.json([{ id: "reactor-ok" }, { id: "reactor-busy" }]),
      ),
      http.get(MEMBER_URL, ({ params }) =>
        params["userId"] === "reactor-busy"
          ? HttpResponse.json({ message: "oops", code: 0 }, { status: 500 })
          : member("ok"),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages[0]?.reactions).toEqual([
      { emoji: "😂", count: 2, users: ["ok"] },
    ]);
  });

  it("should name an author who left the server by their Discord name, or else their id", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([], "1"),
            author: { id: "author-left", username: "left", global_name: null },
          },
          { ...rawMessage([], "2"), author: { id: "nameless" } },
        ]),
      ),
      http.get(MEMBER_URL, goneMember),
    );

    const messages = await getChannelMessages();

    expect(messages.map((m) => m.user.name)).toEqual(["left", "nameless"]);
  });

  it("should ask for a member's name again after a Discord error", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    let attempts = 0;
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([]),
            author: { id: "busy", username: "busy", global_name: null },
            content: "hi",
          },
        ]),
      ),
      http.get(MEMBER_URL, () =>
        ++attempts === 1
          ? HttpResponse.json({ message: "oops", code: 0 }, { status: 500 })
          : member("busy", "Nick"),
      ),
    );

    await expect(getChannelMessages()).rejects.toThrow();
    const messages = await getChannelMessages();

    expect(messages[0]?.user.name).toBe("Nick");
  });

  it("should still serve history when the gateway can't be subscribed to", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    vi.mocked(subscribe).mockRejectedValueOnce(new Error("fatal"));
    server.use(
      http.get(MESSAGES_URL, () => HttpResponse.json([rawMessage([])])),
    );

    expect(await getChannelMessages()).toHaveLength(1);
    expect(log.error).toHaveBeenCalledWith(
      { err: new Error("fatal") },
      "Channel store failed to subscribe to the gateway",
    );
  });

  it("should look up Discord reactors once, leaving changes to the gateway", async () => {
    const lookups = vi.fn(() => HttpResponse.json([]));
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage(
            [{ count: 1, me: false, emoji: { id: null, name: "😂" } }],
            "reactors-cached",
          ),
        ]),
      ),
      http.get(REACTIONS_URL, lookups),
    );

    await getChannelMessages();
    await getChannelMessages();
    expect(lookups).toHaveBeenCalledOnce();
  });

  it("should still count Discord reactions when their names fail to load", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    const lookups = vi.fn(() => new HttpResponse(null, { status: 500 }));
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage([
            { count: 1, me: false, emoji: { id: null, name: "😂" } },
          ]),
        ]),
      ),
      http.get(REACTIONS_URL, lookups),
    );

    const messages = await getChannelMessages();

    expect(messages[0]?.reactions).toEqual([
      { emoji: "😂", count: 1, users: [] },
    ]);
    expect(log.warn).toHaveBeenCalledOnce();

    await getChannelMessages();
    expect(lookups).toHaveBeenCalledTimes(2);
  });

  it("should handle replies as nested messages with multiple levels", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "User1: Parent message",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 19,
            id: "2",
            author: { id: "user2", bot: true },
            content: "User2: First reply",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "1" },
          },
          {
            type: 19,
            id: "3",
            author: { id: "user3", bot: true },
            content: "User3: Reply to reply",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "2" },
          },
          {
            type: 19,
            id: "4",
            author: { id: "user4", bot: true },
            content: "User4: Another top-level reply",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "1" },
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([
      {
        id: "1",
        content: "Parent message",
        replies: [
          {
            id: "2",
            content: "First reply",
            replies: [{ id: "3", content: "Reply to reply" }],
          },
          { id: "4", content: "Another top-level reply" },
        ],
      },
    ]);
  });

  it("should exclude replies that reference missing parent messages", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "User1: Message 1",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 19,
            id: "2",
            author: { id: "user2", bot: true },
            content: "User2: Valid reply to message 1",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "1" },
          },
          {
            type: 19,
            id: "3",
            author: { id: "user3", bot: true },
            content: "User3: Orphaned reply",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "999" },
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ id: "1", replies: [{ id: "2" }] }]);
  });

  it("should not resolve replies whose parent is outside the window", async () => {
    const memberLookups = vi.fn();
    const reactorLookups = vi.fn();
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([
              { count: 1, me: false, emoji: { id: null, name: "😂" } },
            ]),
            author: { id: "user1" },
            content: "Orphaned reply",
            message_reference: { message_id: "999" },
          },
        ]),
      ),
      http.get(MEMBER_URL, () => {
        memberLookups();
        return member("user1");
      }),
      http.get(REACTIONS_URL, () => {
        reactorLookups();
        return HttpResponse.json([]);
      }),
    );

    expect(await getChannelMessages()).toEqual([]);
    expect(memberLookups).not.toHaveBeenCalled();
    expect(reactorLookups).not.toHaveBeenCalled();
  });

  it("should show a forward as a message of its own", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          rawMessage([], "1"),
          {
            ...rawMessage([], "2"),
            message_reference: { type: 1, message_id: "1" },
          },
        ]),
      ),
    );

    expect(await getChannelMessages()).toMatchObject([
      { id: "1", replies: [] },
      { id: "2", replies: [] },
    ]);
  });

  it("should show what a forward forwards", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([], "2"),
            author: { id: "user2", username: "forwarder" },
            content: "",
            message_reference: { type: 1, message_id: "1" },
            message_snapshots: [{ message: { content: "Forwarded text" } }],
          },
          {
            ...rawMessage([], "3"),
            author: { id: "user2", username: "forwarder" },
            content: "",
            message_reference: { type: 1, message_id: "1" },
            message_snapshots: [{ message: { attachments: [] } }],
          },
          {
            ...rawMessage([], "4"),
            content: "",
            message_reference: { type: 1, message_id: "1" },
            message_snapshots: [{ message: { content: "Name: Hi" } }],
          },
        ]),
      ),
      http.get(MEMBER_URL, () => member("forwarder")),
    );

    expect(await getChannelMessages()).toMatchObject([
      { id: "2", content: "Forwarded text" },
      { id: "3", content: "" },
      { id: "4", content: "Name: Hi" },
    ]);
  });

  it("should filter out non-standard message types", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "User: Normal message",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 7,
            id: "2",
            author: { id: "user2" },
            content: "User joined",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 18,
            id: "3",
            author: { id: "user3" },
            content: "Thread created",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages).toMatchObject([{ id: "1" }]);
  });

  it("should sort messages by ID", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            type: 0,
            id: "3",
            author: { id: "user1", bot: true },
            content: "User: Third",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 0,
            id: "1",
            author: { id: "user1", bot: true },
            content: "User: First",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
          {
            type: 0,
            id: "2",
            author: { id: "user1", bot: true },
            content: "User: Second",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          },
        ]),
      ),
    );

    const messages = await getChannelMessages();

    expect(messages.map((m) => m.id)).toEqual(["1", "2", "3"]);
  });

  it("should configure fetch with 5 second timeout", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

    server.use(http.get(MESSAGES_URL, () => HttpResponse.json([])));

    await getChannelMessages();

    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    timeoutSpy.mockRestore();
  });

  it.each([
    { status: 401, statusText: "Unauthorized" },
    { status: 403, statusText: "Forbidden" },
    { status: 404, statusText: "Not Found" },
    { status: 500, statusText: "Internal Server Error" },
  ])("should handle HTTP $status error", async ({ status, statusText }) => {
    vi.spyOn(log, "error").mockImplementation(() => {});

    server.use(
      http.get(
        MESSAGES_URL,
        () => new HttpResponse(JSON.stringify({}), { status, statusText }),
      ),
    );

    await expect(getChannelMessages()).rejects.toThrow(
      `Discord API error: ${status} ${statusText}`,
    );
  });

  it("should handle invalid response schema", async () => {
    server.use(
      http.get(MESSAGES_URL, () => HttpResponse.json({ invalid: "data" })),
    );

    await expect(getChannelMessages()).rejects.toThrow();
  });
});

describe("subscribeToChannel", () => {
  it("should call back once the store has seeded", async () => {
    server.use(http.get(MESSAGES_URL, () => HttpResponse.json([])));
    const callback = vi.fn();

    await subscribeToChannel(callback);
    await getChannelMessages();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("should stop listening when the gateway can't connect", async () => {
    vi.mocked(connect).mockRejectedValueOnce(new Error("fatal"));
    const callback = vi.fn();

    await expect(subscribeToChannel(callback)).rejects.toThrow("fatal");
    server.use(http.get(MESSAGES_URL, () => HttpResponse.json([])));
    await getChannelMessages();

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("getMessageChain", () => {
  it("should return single message when no parent", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        () =>
          HttpResponse.json({
            type: 0,
            id: "single-1",
            author: { id: "user1", bot: true },
            content: "User1: Hello",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          }),
      ),
    );

    const chain = await getMessageChain("single-1");

    expect(chain).toHaveLength(1);
    expect(chain[0]).toMatchObject({ id: "single-1", content: "Hello" });
  });

  it("should read messages in the window from the store", async () => {
    const single = vi.fn(() => HttpResponse.json({}, { status: 500 }));
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([], "stored-2"),
            type: 19,
            content: "User2: Second",
            message_reference: { message_id: "stored-1" },
          },
          rawMessage([], "stored-1"),
        ]),
      ),
      http.get(`${DISCORD_BASE_URL}/channels/:channelId/messages/:id`, single),
    );
    await getChannelMessages();

    const chain = await getMessageChain("stored-2");

    expect(chain.map(({ id }) => id)).toEqual(["stored-1", "stored-2"]);
    expect(single).not.toHaveBeenCalled();
  });

  it("should walk up the chain to root (ordered root-first)", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        ({ params }) => {
          const id = params["messageId"];
          if (id === "chain-3") {
            return HttpResponse.json({
              type: 19,
              id: "chain-3",
              author: { id: "user3", bot: true },
              content: "User3: Third",
              timestamp: "2025-01-01T00:00:00.000000+00:00",
              edited_timestamp: null,
              message_reference: { message_id: "chain-2" },
            });
          }
          if (id === "chain-2") {
            return HttpResponse.json({
              type: 19,
              id: "chain-2",
              author: { id: "user2", bot: true },
              content: "User2: Second",
              timestamp: "2025-01-01T00:00:00.000000+00:00",
              edited_timestamp: null,
              message_reference: { message_id: "chain-1" },
            });
          }
          return HttpResponse.json({
            type: 0,
            id: "chain-1",
            author: { id: "user1", bot: true },
            content: "User1: First",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          });
        },
      ),
    );

    const chain = await getMessageChain("chain-3");

    expect(chain).toHaveLength(3);
    expect(chain.map((m) => m.id)).toEqual(["chain-1", "chain-2", "chain-3"]);
    expect(chain.map((m) => m.content)).toEqual(["First", "Second", "Third"]);
  });

  it("should parse bot messages like any other prefixed message", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        ({ params }) => {
          const id = params["messageId"];
          if (id === "bot-2") {
            return HttpResponse.json({
              type: 19,
              id: "bot-2",
              author: { id: "user2", bot: true },
              content: "User2: Thanks bot!",
              timestamp: "2025-01-01T00:00:00.000000+00:00",
              edited_timestamp: null,
              message_reference: { message_id: "bot-1" },
            });
          }
          return HttpResponse.json({
            type: 0,
            id: "bot-1",
            author: { id: "bot", bot: true },
            content: "simon-bot: Hello human",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          });
        },
      ),
    );

    const chain = await getMessageChain("bot-2");

    expect(chain).toHaveLength(2);
    expect(chain[0]).toMatchObject({
      id: "bot-1",
      username: "simon-bot",
      content: "Hello human",
    });
    expect(chain[1]).toMatchObject({
      id: "bot-2",
      username: "User2",
      content: "Thanks bot!",
    });
  });

  it("should lookup username via API when no prefix", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        () =>
          HttpResponse.json({
            type: 0,
            id: "noprefix-1",
            author: { id: "user999" },
            content: "No prefix here",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
          }),
      ),
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`,
        ({ params }) => {
          expect(params["userId"]).toBe("user999");
          return HttpResponse.json({
            user: { username: "discorduser", global_name: "Discord User" },
            nick: "Server Nick",
          });
        },
      ),
    );

    const chain = await getMessageChain("noprefix-1");

    expect(chain).toHaveLength(1);
    expect(chain[0]).toMatchObject({
      username: "Server Nick",
      content: "No prefix here",
    });
  });

  it("should stop at a forward", async () => {
    server.use(
      http.get(MESSAGES_URL, () =>
        HttpResponse.json([
          {
            ...rawMessage([], "2"),
            message_reference: { type: 1, message_id: "1" },
          },
          rawMessage([], "1"),
        ]),
      ),
    );
    await getChannelMessages();

    const chain = await getMessageChain("2");

    expect(chain.map((m) => m.id)).toEqual(["2"]);
  });

  it("should stop on circular reference", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        ({ params }) => {
          const id = params["messageId"];
          if (id === "circular-2") {
            return HttpResponse.json({
              type: 19,
              id: "circular-2",
              author: { id: "user2", bot: true },
              content: "User2: Reply",
              timestamp: "2025-01-01T00:00:00.000000+00:00",
              edited_timestamp: null,
              message_reference: { message_id: "circular-1" },
            });
          }
          // circular-1 points back to circular-2 (circular)
          return HttpResponse.json({
            type: 0,
            id: "circular-1",
            author: { id: "user1", bot: true },
            content: "User1: First",
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            message_reference: { message_id: "circular-2" },
          });
        },
      ),
    );

    const chain = await getMessageChain("circular-2");

    // Should stop after detecting the cycle
    expect(chain).toHaveLength(2);
    expect(chain.map((m) => m.id)).toEqual(["circular-1", "circular-2"]);
  });

  it("should throw when API returns error", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});

    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        () => HttpResponse.json({}, { status: 404, statusText: "Not Found" }),
      ),
    );

    await expect(getMessageChain("error-msg-1")).rejects.toThrow(
      "Discord API error: 404 Not Found",
    );
  });

  it("should limit chain depth to 50 messages", async () => {
    let callCount = 0;
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/channels/:channelId/messages/:messageId`,
        ({ params }) => {
          callCount++;
          const id = Number(params["messageId"]);
          const parentId = id - 1;
          return HttpResponse.json({
            type: parentId > 0 ? 19 : 0,
            id: String(id),
            author: { id: "user1", bot: true },
            content: `User1: Message ${id}`,
            timestamp: "2025-01-01T00:00:00.000000+00:00",
            edited_timestamp: null,
            ...(parentId > 0 && {
              message_reference: { message_id: String(parentId) },
            }),
          });
        },
      ),
    );

    // Start from message 100 (would be 100 messages deep without limit)
    const chain = await getMessageChain("100");

    expect(chain).toHaveLength(50);
    expect(callCount).toBe(50);
  });
});

describe("postChannelMessage", () => {
  it("should post message with username prefix", async () => {
    server.use(
      http.post(MESSAGES_URL, async ({ request }) => {
        const body = (await request.json()) as { content: string };
        expect(body.content).toBe("TestUser: Hello world");
        expect(request.headers.get("Authorization")).toBe(
          "Bot test-discord-bot-token",
        );
        return HttpResponse.json({ id: "123" });
      }),
    );

    await postChannelMessage("Hello world", "TestUser" as Username);
  });

  it("should return the message ID from Discord", async () => {
    server.use(
      http.post(MESSAGES_URL, async ({ request }) => {
        const body = (await request.json()) as { content: string };
        expect(body.content).toBe("TestUser: Hello");
        return HttpResponse.json({ id: "message-123" });
      }),
    );

    const messageId = await postChannelMessage("Hello", "TestUser" as Username);

    expect(messageId).toBe("message-123");
  });

  it("should include message_reference when replyToMessageId is provided", async () => {
    server.use(
      http.post(MESSAGES_URL, async ({ request }) => {
        const body = (await request.json()) as {
          content: string;
          message_reference?: { message_id: string };
        };
        expect(body.content).toBe("simon-bot: This is a reply");
        expect(body.message_reference).toEqual({
          message_id: "original-123",
          fail_if_not_exists: false,
        });
        return HttpResponse.json({ id: "reply-456" });
      }),
    );

    const messageId = await postChannelMessage(
      "This is a reply",
      "simon-bot" as Username,
      "original-123",
    );

    expect(messageId).toBe("reply-456");
  });

  it("should not include message_reference when replyToMessageId is undefined", async () => {
    server.use(
      http.post(MESSAGES_URL, async ({ request }) => {
        const body = (await request.json()) as {
          content: string;
          message_reference?: { message_id: string };
        };
        expect(body.message_reference).toBeUndefined();
        return HttpResponse.json({ id: "msg-789" });
      }),
    );

    await postChannelMessage("No reply", "TestUser" as Username);
  });

  it.each([
    { status: 401, statusText: "Unauthorized" },
    { status: 403, statusText: "Forbidden" },
    { status: 500, statusText: "Internal Server Error" },
  ])("should handle HTTP $status error", async ({ status, statusText }) => {
    vi.spyOn(log, "error").mockImplementation(() => {});

    server.use(
      http.post(
        MESSAGES_URL,
        () => new HttpResponse(JSON.stringify({}), { status, statusText }),
      ),
    );

    await expect(
      postChannelMessage("Hello", "TestUser" as Username),
    ).rejects.toThrow(`Discord API error: ${status} ${statusText}`);
  });
});

describe("bot reactions", () => {
  it.each([
    { name: "add", method: http.put, call: addBotReaction, emoji: "👍🏽" },
    {
      name: "remove",
      method: http.delete,
      call: removeBotReaction,
      emoji: "🎉",
    },
  ])(
    "should $name the bot's reaction with the emoji encoded",
    async ({ method, call, emoji }) => {
      const onRequest = vi.fn();
      server.use(
        method(BOT_REACTION_URL, ({ params }) => {
          onRequest(params);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await call("123", emoji);

      expect(onRequest).toHaveBeenCalledWith({
        channelId: "test-discord-channel-id",
        messageId: "123",
        emoji,
      });
    },
  );

  it("should carry Discord's error code", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    server.use(
      http.put(BOT_REACTION_URL, () =>
        HttpResponse.json(
          { message: "Maximum number of reactions reached (20)", code: 30010 },
          { status: 400 },
        ),
      ),
    );

    await expect(addBotReaction("123", "👍")).rejects.toMatchObject({
      name: "DiscordApiError",
      code: 30010,
    });
  });
});

describe("response bodies", () => {
  it("should accept a success with an empty body", async () => {
    server.use(
      http.put(BOT_REACTION_URL, () => new HttpResponse(null, { status: 200 })),
    );

    await expect(addBotReaction("1", "👍")).resolves.toBeUndefined();
  });

  it.each([
    {
      status: 502,
      statusText: "Bad Gateway",
      error: "502 Bad Gateway",
      logged: "Discord API call failed",
    },
    {
      status: 200,
      statusText: "OK",
      error: "200 body isn't JSON",
      logged: "Discord API body isn't JSON",
    },
  ])(
    "should report the status of a $status whose body isn't JSON",
    async ({ status, statusText, error, logged }) => {
      const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
      server.use(
        http.put(BOT_REACTION_URL, () =>
          HttpResponse.html("<html>Not JSON</html>", { status, statusText }),
        ),
      );

      await expect(addBotReaction("1", "👍")).rejects.toMatchObject({
        name: "DiscordApiError",
        message: `Discord API error: ${error}`,
        code: undefined,
      });
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status, body: "<html>Not JSON</html>" }),
        logged,
      );
    },
  );

  it("should not mistake a failed body read for a body that isn't JSON", async () => {
    const timeout = new DOMException(
      "The operation timed out.",
      "TimeoutError",
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(timeout);
          },
        }),
        { status: 429 },
      ),
    );

    await expect(getChannelMessages()).rejects.toBe(timeout);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    _resetRateLimitState();
  });

  it("should retry after 429s and count the retries in the logs", async () => {
    const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
    const requests = onceThen(() => rateLimited(1), emptyList, 3);
    server.use(http.get(MESSAGES_URL, requests));

    const promise = getChannelMessages();
    await vi.advanceTimersByTimeAsync(3000);
    await promise;

    expect(requests).toHaveBeenCalledTimes(4);
    expect(logWarnSpy).toHaveBeenCalledTimes(3);
    for (const retries of [1, 2, 3]) {
      expect(logWarnSpy).toHaveBeenNthCalledWith(
        retries,
        expect.objectContaining({ retries }),
        "Discord rate limited, retrying",
      );
    }
  });

  it("should throw when elapsed + retry_after exceeds timeout", async () => {
    const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
    server.use(http.get(MESSAGES_URL, () => rateLimited(35, true)));

    await expect(getChannelMessages()).rejects.toThrow(
      "Discord rate limit exceeded",
    );

    expect(logErrorSpy).toHaveBeenCalledWith(
      {
        endpoint: expect.any(String),
        elapsedMs: 0,
        retryAfterMs: 35000,
        global: true,
        retries: 1,
      },
      "Discord rate limit exceeded max wait time",
    );
  });

  it("should account for elapsed time in timeout calculation", async () => {
    const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
    const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
    const requests = onceThen(
      () => rateLimited(15),
      () => rateLimited(16),
    );
    server.use(http.get(MESSAGES_URL, requests));

    const promise = getChannelMessages();
    // Set up rejection expectation before advancing time to avoid unhandled rejection
    const assertion = expect(promise).rejects.toThrow(
      "Discord rate limit exceeded",
    );

    await vi.advanceTimersByTimeAsync(15000);
    await assertion;

    expect(requests).toHaveBeenCalledTimes(2);
    expect(logWarnSpy).toHaveBeenCalledWith(
      {
        endpoint: expect.any(String),
        retryAfterMs: 15000,
        global: false,
        retries: 1,
      },
      "Discord rate limited, retrying",
    );
    expect(logErrorSpy).toHaveBeenCalledWith(
      {
        endpoint: expect.any(String),
        elapsedMs: 15000,
        retryAfterMs: 16000,
        global: false,
        retries: 2,
      },
      "Discord rate limit exceeded max wait time",
    );
  });

  it("should throw when max retries exceeded", async () => {
    const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
    const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
    const requests = vi.fn(() => rateLimited(1));
    server.use(http.get(MESSAGES_URL, requests));

    const promise = getChannelMessages();
    const assertion = expect(promise).rejects.toThrow(
      "Discord rate limit exceeded",
    );

    await vi.advanceTimersByTimeAsync(10000);
    await assertion;

    // 1 initial + 5 retries = 6 total attempts
    expect(requests).toHaveBeenCalledTimes(6);
    expect(logWarnSpy).toHaveBeenCalledTimes(5);
    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ retries: 6 }),
      "Discord rate limit exceeded max wait time",
    );
  });

  it.each([
    [
      "another message on the same route",
      () => rateLimited(2),
      () => addBotReaction("2", "🎉"),
      true,
    ],
    [
      "each method on a route separately",
      () => rateLimited(2),
      () => removeBotReaction("2", "🎉"),
      false,
    ],
    [
      "every route after a global 429",
      () => rateLimited(2, true),
      getChannelMessages,
      true,
    ],
    [
      "every route on a 429 whose header says it's global",
      () =>
        htmlRateLimited({ "Retry-After": "2", "X-RateLimit-Global": "true" }),
      getChannelMessages,
      true,
    ],
  ])("should gate %s", async (_, response, secondCall, heldBack) => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    server.use(
      http.put(BOT_REACTION_URL, onceThen(response, noContent)),
      http.delete(BOT_REACTION_URL, noContent),
      http.get(MESSAGES_URL, emptyList),
    );

    const first = addBotReaction("1", "👍");
    await vi.advanceTimersByTimeAsync(0);
    let settled = false;
    const second = secondCall().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(1999);
    expect(settled).toBe(!heldBack);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second]);
  });

  it.each([
    ["retry_after 0", () => rateLimited(0), 1000],
    [
      "a JSON body without retry_after",
      () => HttpResponse.json({ invalid: "response" }, { status: 429 }),
      1000,
    ],
    ["a body that isn't JSON", () => htmlRateLimited(), 1000],
    ["Retry-After 3", () => htmlRateLimited({ "Retry-After": "3" }), 3000],
    [
      "Retry-After as an HTTP-date",
      () =>
        htmlRateLimited({
          "Retry-After": new Date(Date.now() + 3000).toUTCString(),
        }),
      3000,
    ],
    ["Retry-After 0", () => htmlRateLimited({ "Retry-After": "0" }), 1000],
    [
      "an invalid Retry-After",
      () => htmlRateLimited({ "Retry-After": "soon" }),
      1000,
    ],
    [
      "a negative Retry-After",
      () => htmlRateLimited({ "Retry-After": "-5" }),
      1000,
    ],
    [
      "an exponent Retry-After",
      () => htmlRateLimited({ "Retry-After": "1e3" }),
      1000,
    ],
    [
      "a fractional Retry-After",
      () => htmlRateLimited({ "Retry-After": "1.5" }),
      1000,
    ],
    [
      "a malformed date Retry-After",
      () => htmlRateLimited({ "Retry-After": "Sun, 99 Foo 2026 00:00:00 GMT" }),
      1000,
    ],
    [
      "a past date Retry-After",
      () =>
        htmlRateLimited({
          "Retry-After": new Date(Date.now() - 3000).toUTCString(),
        }),
      1000,
    ],
    [
      "an empty Retry-After",
      () => htmlRateLimited({ "Retry-After": "" }),
      1000,
    ],
  ])(
    "should wait the right delay after a 429 with %s",
    async (_, response, retryAfterMs) => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
      const requests = onceThen(response, emptyList);
      server.use(http.get(MESSAGES_URL, requests));

      const promise = getChannelMessages();
      await vi.advanceTimersByTimeAsync(retryAfterMs - 1);
      expect(requests).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      await promise;

      expect(requests).toHaveBeenCalledTimes(2);
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfterMs }),
        "Discord rate limited, retrying",
      );
    },
  );

  it("should back off on 429s with no Retry-After", async () => {
    const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
    server.use(http.get(MESSAGES_URL, onceThen(htmlRateLimited, emptyList, 3)));

    const promise = getChannelMessages();
    await vi.advanceTimersByTimeAsync(7000);
    await promise;

    for (const [i, retryAfterMs] of [1000, 2000, 4000].entries()) {
      expect(logWarnSpy).toHaveBeenNthCalledWith(
        i + 1,
        expect.objectContaining({ retryAfterMs, global: false }),
        "Discord rate limited, retrying",
      );
    }
  });

  it("should keep a long gate, so callers fail fast instead of re-hitting Discord", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const messageRequests = vi.fn(emptyList);
    server.use(
      http.put(BOT_REACTION_URL, () => rateLimited(3600, true)),
      http.get(MESSAGES_URL, messageRequests),
    );

    await expect(addBotReaction("1", "👍")).rejects.toThrow(
      "Discord rate limit exceeded",
    );
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(getChannelMessages()).rejects.toThrow(
      "Discord rate limit exceeded",
    );
    expect(messageRequests).not.toHaveBeenCalled();
  });

  it("should spread out callers on a gate and keep them waiting when it moves", async () => {
    vi.spyOn(log, "warn").mockImplementation(() => {});
    const requests = onceThen(() => rateLimited(5), noContent);
    server.use(http.put(BOT_REACTION_URL, requests));
    _setRateLimitGate("PUT", BOT_REACTION_ROUTE, Date.now() + 1000);

    vi.mocked(Math.random).mockReturnValueOnce(0).mockReturnValueOnce(0.8);
    const first = addBotReaction("1", "👍");
    const second = addBotReaction("2", "🎉");

    await vi.advanceTimersByTimeAsync(1000);
    expect(requests).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(200);
    expect(requests).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(5000);
    await Promise.all([first, second]);
    expect(requests).toHaveBeenCalledTimes(3);
  });

  it.each([
    { waitMs: 31_000, jitter: 0 },
    { waitMs: 29_900, jitter: 0.8 },
  ])(
    "should fail fast on a $waitMs ms gate with $jitter jitter",
    async ({ waitMs, jitter }) => {
      const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
      vi.mocked(Math.random).mockReturnValue(jitter);
      _setRateLimitGate(
        "GET",
        "/channels/{channel.id}/messages",
        Date.now() + waitMs,
      );

      await expect(getChannelMessages()).rejects.toThrow(
        "Discord rate limit exceeded",
      );
      expect(logErrorSpy).toHaveBeenCalledWith(
        {
          endpoint: "/channels/test-discord-channel-id/messages",
          elapsedMs: expect.any(Number),
          waitMs,
          retries: 0,
        },
        "Discord rate limit exceeded max wait time",
      );
    },
  );

  it("should give up on a 429 the gate's wait wouldn't fit", async () => {
    const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => {});
    const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
    server.use(http.get(MESSAGES_URL, () => rateLimited(29.9)));

    await expect(getChannelMessages()).rejects.toThrow(
      "Discord rate limit exceeded",
    );
    expect(logWarnSpy).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ retryAfterMs: 29_900, retries: 1 }),
      "Discord rate limit exceeded max wait time",
    );
  });
});

describe("searchChannelMessages", () => {
  it("should search messages and return hits with context", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/messages/search`,
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("content")).toBe("hello");
          expect(url.searchParams.get("channel_id")).toBe(
            "test-discord-channel-id",
          );
          expect(url.searchParams.get("limit")).toBe("5");
          expect(url.searchParams.get("sort_by")).toBe("relevance");
          expect(url.searchParams.get("sort_order")).toBe("desc");

          return HttpResponse.json({
            total_results: 1,
            messages: [
              [
                {
                  type: 0,
                  id: "ctx-1",
                  author: { id: "user1", bot: true },
                  content: "Alice: before the match",
                  timestamp: "2025-01-01T00:00:00.000000+00:00",
                  edited_timestamp: null,
                },
                {
                  type: 0,
                  id: "hit-1",
                  author: { id: "user2", bot: true },
                  content: "Bob: hello everyone",
                  timestamp: "2025-01-01T00:01:00.000000+00:00",
                  edited_timestamp: null,
                  hit: true,
                },
                {
                  type: 0,
                  id: "ctx-2",
                  author: { id: "user3", bot: true },
                  content: "Charlie: after the match",
                  timestamp: "2025-01-01T00:02:00.000000+00:00",
                  edited_timestamp: null,
                },
              ],
            ],
          });
        },
      ),
    );

    const result = await searchChannelMessages({
      content: "hello",
      limit: 5,
      sort_by: "relevance",
      sort_order: "desc",
    });

    expect(result).toEqual({
      total_results: 1,
      hits: [
        {
          hit: {
            id: "hit-1",
            username: "Bob",
            content: "hello everyone",
            timestamp: "2025-01-01T00:01:00.000000+00:00",
          },
          context: [
            {
              id: "ctx-1",
              username: "Alice",
              content: "before the match",
              timestamp: "2025-01-01T00:00:00.000000+00:00",
            },
            {
              id: "ctx-2",
              username: "Charlie",
              content: "after the match",
              timestamp: "2025-01-01T00:02:00.000000+00:00",
            },
          ],
        },
      ],
    });
  });

  it("should handle empty search results", async () => {
    server.use(
      http.get(`${DISCORD_BASE_URL}/guilds/:guildId/messages/search`, () =>
        HttpResponse.json({ total_results: 0, messages: [] }),
      ),
    );

    const result = await searchChannelMessages({ content: "nonexistent" });

    expect(result).toEqual({ total_results: 0, hits: [] });
  });

  it("should resolve username via guild member API when no prefix", async () => {
    server.use(
      http.get(`${DISCORD_BASE_URL}/guilds/:guildId/messages/search`, () =>
        HttpResponse.json({
          total_results: 1,
          messages: [
            [
              {
                type: 0,
                id: "search-noprefix-1",
                author: { id: "user-lookup-1" },
                content: "unprefixed message",
                timestamp: "2025-06-01T12:00:00.000000+00:00",
                edited_timestamp: null,
                hit: true,
              },
            ],
          ],
        }),
      ),
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/members/:userId`,
        ({ params }) => {
          expect(params["userId"]).toBe("user-lookup-1");
          return HttpResponse.json({
            user: { username: "discorduser", global_name: "Discord User" },
            nick: "Nickname",
          });
        },
      ),
    );

    const result = await searchChannelMessages({ content: "unprefixed" });

    expect(result.hits[0]?.hit).toMatchObject({
      username: "Nickname",
      content: "unprefixed message",
    });
  });

  it("should pass only provided params to Discord API", async () => {
    server.use(
      http.get(
        `${DISCORD_BASE_URL}/guilds/:guildId/messages/search`,
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("content")).toBe("test");
          expect(url.searchParams.get("channel_id")).toBe(
            "test-discord-channel-id",
          );
          expect(url.searchParams.has("limit")).toBe(false);
          expect(url.searchParams.has("sort_by")).toBe(false);
          expect(url.searchParams.has("sort_order")).toBe(false);

          return HttpResponse.json({ total_results: 0, messages: [] });
        },
      ),
    );

    await searchChannelMessages({ content: "test" });
  });

  it("should throw when a message group has no hit marker", async () => {
    server.use(
      http.get(`${DISCORD_BASE_URL}/guilds/:guildId/messages/search`, () =>
        HttpResponse.json({
          total_results: 1,
          messages: [
            [
              {
                type: 0,
                id: "no-hit-1",
                author: { id: "user1", bot: true },
                content: "Alice: no hit flag",
                timestamp: "2025-01-01T00:00:00.000000+00:00",
                edited_timestamp: null,
              },
            ],
          ],
        }),
      ),
    );

    await expect(searchChannelMessages({ content: "test" })).rejects.toThrow(
      "Discord search returned a message group with no hit",
    );
  });
});
