import "server-only";
import { comparing, stringComparator } from "comparator.ts";
import { z } from "zod";

import { env } from "@/lib/env";
import { getGlobal } from "@/lib/global";
import { log } from "@/lib/log";
import { stringToColor } from "@/lib/stringToColor";

import type { Username } from "../session";
import { connect, getBotUserId, subscribe } from "./gateway";
import {
  type DiscordMessage,
  DiscordMessageSchema,
  displayName,
  GuildMemberSchema,
  parentId,
} from "./schemas";
import { ChannelStore, type Reactor, WINDOW } from "./store";

const BASE_URL = "https://discord.com/api/v10";
const RATE_LIMIT_TIMEOUT_MS = 30_000;
const GATE_JITTER_MS = 250;
const MAX_RETRIES = 5;
const BODY_SNIPPET_LENGTH = 200;

const RateLimitResponseSchema = z.object({
  message: z.string(),
  retry_after: z.number(),
  global: z.boolean(),
  code: z.number().optional(),
});

const ErrorResponseSchema = z.object({ code: z.number() });

export class DiscordApiError extends Error {
  readonly code: number | undefined;

  constructor(message: string, code: number | undefined) {
    super(message);
    this.name = "DiscordApiError";
    this.code = code;
  }
}

// Route key (or GLOBAL_GATE) → when requests may go again.
const rateLimitUntil = new Map<string, number>();
const GLOBAL_GATE = "global";

/** @internal Exported for testing. Discord buckets by method, route and channel or guild. */
export function routeOf(method: string, endpoint: string): string {
  const route = endpoint
    .split("/")
    .map((segment, i, segments) => {
      const previous = segments[i - 1];
      if (previous === "channels" || previous === "guilds") return segment;
      if (previous === "reactions") return ":emoji";
      return /^\d+$/.test(segment) ? ":id" : segment;
    })
    .join("/");
  return `${method} ${route}`;
}

// Counts the most jitter a wait can add, so a 429 and the gate agree on whether to give up.
function exceedsWaitBudget(elapsedMs: number, waitMs: number): boolean {
  return elapsedMs + waitMs + GATE_JITTER_MS > RATE_LIMIT_TIMEOUT_MS;
}

// Retry-After is either delta-seconds or an HTTP-date.
function retryAfterHeaderMs(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    const date = Date.parse(value);
    return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
  }
  return seconds >= 0 ? seconds * 1000 : undefined;
}

function gateUntil(route: string): number {
  let until = 0;
  for (const key of [route, GLOBAL_GATE]) {
    const value = rateLimitUntil.get(key);
    if (value === undefined) continue;
    if (value <= Date.now()) rateLimitUntil.delete(key);
    else until = Math.max(until, value);
  }
  return until;
}

/** @internal Exported for test cleanup only */
export function _resetRateLimitState(): void {
  rateLimitUntil.clear();
}

/** @internal Exported for testing the gate timeout path */
export function _setRateLimitGate(
  method: string,
  endpoint: string,
  until: number,
): void {
  rateLimitUntil.set(routeOf(method, endpoint), until);
}

async function call<T extends z.ZodType>(
  method: string,
  endpoint: string,
  schema: T,
  params: Record<string, unknown> = {},
): Promise<z.infer<T>> {
  const url = new URL(`${BASE_URL}/${endpoint}`);

  if (method === "GET") {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const route = routeOf(method, endpoint);
  const startTime = performance.now();
  let retries = 0;

  while (true) {
    // Re-read after each sleep, since another 429 may have moved the gate.
    for (;;) {
      const waitMs = gateUntil(route) - Date.now();
      if (waitMs <= 0) break;
      const elapsedMs = performance.now() - startTime;
      if (exceedsWaitBudget(elapsedMs, waitMs)) {
        log.error(
          { endpoint, elapsedMs, waitMs, retries },
          "Discord rate limit exceeded max wait time",
        );
        throw new Error(`Discord rate limit exceeded`);
      }
      // Jitter, so callers waiting on one gate don't all retry at once.
      const jitterMs = Math.random() * GATE_JITTER_MS;
      await new Promise((resolve) => setTimeout(resolve, waitMs + jitterMs));
    }

    const response = await fetch(url, {
      method,
      body: method === "POST" ? JSON.stringify(params) : undefined,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const text = response.status === 204 ? "null" : await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // A proxy's HTML error page falls back like an unexpected body; a success can't.
      if (response.ok) {
        log.error(
          {
            endpoint,
            status: response.status,
            body: text.slice(0, BODY_SNIPPET_LENGTH),
          },
          "Discord API body isn't JSON",
        );
        throw new DiscordApiError(
          `Discord API error: ${response.status} body isn't JSON`,
          undefined,
        );
      }
    }

    if (response.status === 429) {
      retries++;

      const rateLimit = RateLimitResponseSchema.safeParse(json);
      const retryAfterMs = rateLimit.success
        ? rateLimit.data.retry_after * 1000
        : (retryAfterHeaderMs(response.headers.get("retry-after")) ?? 1000);
      const global =
        (rateLimit.success && rateLimit.data.global) ||
        response.headers.get("x-ratelimit-global") === "true";

      // Outlives a caller that gives up, capped at the longest anyone waits.
      const gate = global ? GLOBAL_GATE : route;
      const newUntil =
        Date.now() +
        Math.min(retryAfterMs, RATE_LIMIT_TIMEOUT_MS - GATE_JITTER_MS);
      const existing = rateLimitUntil.get(gate) ?? 0;
      rateLimitUntil.set(gate, Math.max(existing, newUntil));

      const elapsedMs = performance.now() - startTime;

      if (retries > MAX_RETRIES || exceedsWaitBudget(elapsedMs, retryAfterMs)) {
        log.error(
          { endpoint, elapsedMs, retryAfterMs, global, retries },
          "Discord rate limit exceeded max wait time",
        );
        throw new Error(`Discord rate limit exceeded`);
      }

      log.warn(
        { endpoint, retryAfterMs, global, retries },
        "Discord rate limited, retrying",
      );
      continue;
    }

    if (!response.ok) {
      log.error(
        {
          endpoint,
          status: response.status,
          body: json ?? text.slice(0, BODY_SNIPPET_LENGTH),
        },
        "Discord API call failed",
      );
      throw new DiscordApiError(
        `Discord API error: ${response.status} ${response.statusText}`,
        ErrorResponseSchema.safeParse(json).data?.code,
      );
    }

    return schema.parse(json);
  }
}

async function getGuildMember(userId: string) {
  return call(
    "GET",
    `guilds/${env.DISCORD_GUILD_ID}/members/${userId}`,
    GuildMemberSchema,
  );
}

const UserSchema = z.object({
  name: z.string(),
  color: z.templateLiteral([
    "hsl(",
    z.number(),
    " ",
    z.number(),
    "% ",
    z.number(),
    "%)",
  ]),
});

export type User = z.infer<typeof UserSchema>;

function toUser(name: string): User {
  return UserSchema.decode({ name, color: stringToColor(name) });
}

const USERNAME_PREFIX_PATTERN = /^(.+?):(?:\s(.*))?$/s;

function parseUsernamePrefix(content: string): [string, string] | undefined {
  const match = content.match(USERNAME_PREFIX_PATTERN);
  return match ? [match[1]!, match[2] ?? ""] : undefined;
}

async function authorName(msg: DiscordMessage): Promise<string> {
  return (
    (await getStore().memberName(msg.author.id)) ??
    displayName(msg.author) ??
    msg.author.id
  );
}

async function resolveMessageContent(
  msg: DiscordMessage,
): Promise<{ username: string; content: string }> {
  // A forward's own content is empty; what it forwards is in its snapshot.
  const text =
    msg.content || (msg.message_snapshots?.[0]?.message.content ?? "");
  const parsed = msg.author.bot ? parseUsernamePrefix(text) : undefined;
  const username = parsed ? parsed[0] : await authorName(msg);
  const content = (parsed?.[1] ?? text).trim();
  return { username, content };
}

// Discord's "Unknown Member" and "Unknown User".
const GONE_CODES = new Set<number | undefined>([10007, 10013]);

async function getMemberName(userId: string): Promise<string | undefined> {
  try {
    const member = await getGuildMember(userId);
    return displayName(member.user, member);
  } catch (err) {
    // Someone who left the server has no member; asking again won't change that.
    if (err instanceof DiscordApiError && GONE_CODES.has(err.code)) {
      return undefined;
    }
    throw err;
  }
}

function getMessage(id: string): Promise<DiscordMessage> {
  return call(
    "GET",
    `channels/${env.DISCORD_CHANNEL_ID}/messages/${id}`,
    DiscordMessageSchema,
  );
}

const GetMessagesResponseSchema = z.array(DiscordMessageSchema);

const ReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  /** Who reacted, where known; the rest of `count` reacted on Discord. */
  users: z.array(z.string()),
  /** The visitor's own, set per request by the page; `users` then leaves them out. */
  mine: z.boolean().optional(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

// The bot's own reaction mirrors the site's, which are counted from Turso instead.
function toReactions(msg: DiscordMessage): Reaction[] {
  const reactions: Reaction[] = [];
  for (const { count, me, emoji } of msg.reactions ?? []) {
    const discordCount = me ? count - 1 : count;
    if (emoji.id === null && emoji.name !== null && discordCount > 0) {
      reactions.push({ emoji: emoji.name, count: discordCount, users: [] });
    }
  }
  return reactions;
}

const ReactorsResponseSchema = z.array(
  z.object({ id: z.string(), bot: z.boolean().optional() }),
);

const REACTORS_PAGE = 100;

// Pages through everyone, since the store keeps the set as exact.
async function getReactors(messageId: string, emoji: string) {
  const reactors: Reactor[] = [];
  let after: string | undefined;
  for (;;) {
    const page = await call(
      "GET",
      reactionEndpoint(messageId, emoji),
      ReactorsResponseSchema,
      after ? { limit: REACTORS_PAGE, after } : { limit: REACTORS_PAGE },
    );
    reactors.push(...page);
    after = page.at(-1)?.id;
    if (page.length < REACTORS_PAGE || !after) return reactors;
  }
}

async function getRecentMessages(): Promise<DiscordMessage[]> {
  const messages = await call(
    "GET",
    `channels/${env.DISCORD_CHANNEL_ID}/messages`,
    GetMessagesResponseSchema,
    { limit: WINDOW },
  );
  return messages.toReversed();
}

function getStore(): ChannelStore {
  return getGlobal("simon.dev/discord-store", () => {
    const store = new ChannelStore({
      fetchMessages: getRecentMessages,
      fetchMessage: getMessage,
      fetchReactors: getReactors,
      fetchMemberName: getMemberName,
      botUserId: getBotUserId,
    });
    subscribe((event) => store.apply(event)).catch((err: unknown) => {
      log.error({ err }, "Channel store failed to subscribe to the gateway");
    });
    return store;
  });
}

/** Calls back once the history may have changed; rejects if the gateway can't connect. */
export async function subscribeToChannel(
  callback: () => void,
): Promise<() => void> {
  const unlisten = getStore().listen(callback);
  try {
    await connect();
  } catch (err) {
    unlisten();
    throw err;
  }
  return unlisten;
}

async function withDiscordReactors(
  messageId: string,
  reactions: Reaction[],
): Promise<Reaction[]> {
  const store = getStore();
  return Promise.all(
    reactions.map(async (reaction) => {
      try {
        const ids = await store.reactorIds(messageId, reaction.emoji);
        const names = await Promise.allSettled(
          ids.map((id) => store.memberName(id)),
        );
        // A reactor who left the server, or whose name failed to load, stays in the count unnamed.
        return {
          ...reaction,
          users: names.flatMap((name) =>
            name.status === "fulfilled" && name.value !== undefined
              ? [name.value]
              : [],
          ),
        };
      } catch (err) {
        log.warn(
          { err, messageId, emoji: reaction.emoji },
          "Failed to load reactors",
        );
        return reaction;
      }
    }),
  );
}

const MessageSchema = z.object({
  id: z.string(),
  user: UserSchema,
  /** Raw Discord markdown, never HTML — render with `<ChatMarkdown>`, never `dangerouslySetInnerHTML`. */
  content: z.string(),
  edited: z.boolean(),
  timestamp: z.string().pipe(z.coerce.date()),
  reactions: z.array(ReactionSchema),
  get replies() {
    return z.array(MessageSchema);
  },
});

export type Message = z.infer<typeof MessageSchema>;

const messageIdComparator = comparing(
  (msg: Message) => msg.id,
  stringComparator,
);

export async function getChannelMessages(limit = WINDOW): Promise<Message[]> {
  const window = (await getStore().messages()).slice(-limit);

  const byParent = Map.groupBy(window, parentId);

  // Only replies reachable from a root are converted.
  const toMessages = async (
    discordMessages: DiscordMessage[],
  ): Promise<Message[]> => {
    const messages = await Promise.all(
      discordMessages.map(async (discordMessage) => {
        const [{ username, content }, reactions, children] = await Promise.all([
          resolveMessageContent(discordMessage),
          withDiscordReactors(discordMessage.id, toReactions(discordMessage)),
          toMessages(byParent.get(discordMessage.id) ?? []),
        ]);

        const message = MessageSchema.decode({
          id: discordMessage.id,
          user: toUser(username),
          content,
          edited: discordMessage.edited_timestamp !== null,
          timestamp: discordMessage.timestamp,
          reactions,
          replies: [],
        });
        message.replies = children;
        return message;
      }),
    );
    return messages.sort(messageIdComparator);
  };

  return toMessages(byParent.get(undefined) ?? []);
}

export type ChainMessage = {
  id: string;
  type: number;
  username: string;
  content: string;
  reactions: Reaction[];
};

const MAX_CHAIN_DEPTH = 50;

export async function getMessageChain(
  messageId: string,
): Promise<ChainMessage[]> {
  const chain: ChainMessage[] = [];
  const seen = new Set<string>();
  let currentId: string | undefined = messageId;

  while (currentId && chain.length < MAX_CHAIN_DEPTH) {
    // Cycle detection
    if (seen.has(currentId)) break;
    seen.add(currentId);

    const response = await getStore().find(currentId);

    const { username, content } = await resolveMessageContent(response);

    chain.unshift({
      id: response.id,
      type: response.type,
      username,
      content,
      reactions: toReactions(response),
    });

    currentId = parentId(response);
  }

  return chain;
}

const SearchMessageSchema = DiscordMessageSchema.extend({
  hit: z.boolean().optional(),
});

const SearchGuildMessagesResponseSchema = z.object({
  total_results: z.number(),
  messages: z.array(z.array(SearchMessageSchema)),
});

export type SearchMessage = {
  id: string;
  username: string;
  content: string;
  timestamp: string;
};

export type SearchHit = { hit: SearchMessage; context: SearchMessage[] };

export type SearchResult = { total_results: number; hits: SearchHit[] };

async function resolveSearchMessage(
  msg: z.infer<typeof SearchMessageSchema>,
): Promise<SearchMessage> {
  const { username, content } = await resolveMessageContent(msg);
  return { id: msg.id, username, content, timestamp: msg.timestamp };
}

export async function searchChannelMessages(params: {
  content: string;
  limit?: number;
  sort_by?: "timestamp" | "relevance";
  sort_order?: "asc" | "desc";
}): Promise<SearchResult> {
  const response = await call(
    "GET",
    `guilds/${env.DISCORD_GUILD_ID}/messages/search`,
    SearchGuildMessagesResponseSchema,
    { channel_id: env.DISCORD_CHANNEL_ID, ...params },
  );

  const hits = await Promise.all(
    response.messages.map(async (group) => {
      const hitMsg = group.find((msg) => msg.hit === true);
      if (!hitMsg) {
        throw new Error("Discord search returned a message group with no hit");
      }

      const contextMsgs = group.filter((msg) => msg !== hitMsg);

      const [hit, ...context] = await Promise.all([
        resolveSearchMessage(hitMsg),
        ...contextMsgs.map(resolveSearchMessage),
      ]);

      return { hit, context };
    }),
  );

  return { total_results: response.total_results, hits };
}

const PostChannelMessageResponseSchema = z.object({ id: z.string() });

export async function postChannelMessage(
  text: string,
  username: Username,
  replyToMessageId?: string,
): Promise<string> {
  const body = {
    content: `${username}: ${text}`,
    message_reference: replyToMessageId
      ? { message_id: replyToMessageId }
      : undefined,
  };

  const response = await call(
    "POST",
    `channels/${env.DISCORD_CHANNEL_ID}/messages`,
    PostChannelMessageResponseSchema,
    body,
  );

  return response.id;
}

function reactionEndpoint(messageId: string, emoji: string): string {
  return `channels/${env.DISCORD_CHANNEL_ID}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`;
}

function botReactionEndpoint(messageId: string, emoji: string): string {
  return `${reactionEndpoint(messageId, emoji)}/@me`;
}

export async function addBotReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  await call("PUT", botReactionEndpoint(messageId, emoji), z.null());
}

export async function removeBotReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  await call("DELETE", botReactionEndpoint(messageId, emoji), z.null());
}
