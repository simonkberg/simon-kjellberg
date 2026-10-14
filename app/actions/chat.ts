"use server";

import { cacheLife, cacheTag, refresh, updateTag } from "next/cache";
import { z } from "zod";

import { setChatTipDismissed } from "@/lib/chatTip";
import {
  getChannelMessages,
  type Message,
  postChannelMessage,
} from "@/lib/discord/api";
import { identifiers } from "@/lib/identifiers";
import { isDeniedIp } from "@/lib/ipDenyList";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rateLimit";
import {
  EmojiSchema,
  toggleReaction,
  withSiteReactions,
} from "@/lib/reactions";
import { getSession } from "@/lib/session";
import { replaceShortcodes } from "@/lib/shortcodes";

export type ChatHistoryResult =
  | { status: "ok"; messages: Message[] }
  | { status: "error"; error: string };

export async function getChatHistory(): Promise<ChatHistoryResult> {
  "use cache";
  cacheLife("seconds");
  cacheTag("getChatHistory");

  try {
    const messages = await withSiteReactions(await getChannelMessages());
    return { status: "ok", messages };
  } catch (err) {
    log.error({ err, action: "getChatHistory" }, "Error fetching chat history");
    return { status: "error", error: "Failed to fetch chat history" };
  }
}

const RATE_LIMIT = { limit: 5, windowMs: 30_000 };

export async function refreshChatHistory() {
  updateTag("getChatHistory");
  refresh();
}

export async function dismissChatTip() {
  await setChatTipDismissed();
}

export type PostChatMessageResult =
  | { status: "initial" }
  | { status: "ok" }
  | { status: "error"; error: string };

export async function postChatMessage(
  formData: FormData,
): Promise<PostChatMessageResult> {
  try {
    const text = replaceShortcodes(
      z.string().trim().min(1).parse(formData.get("text")),
    );
    const replyToId = z
      .string()
      .optional()
      .parse(formData.get("replyToId") ?? undefined);

    const { username } = await getSession();

    const request = await identifiers();
    if (request.ip !== undefined && isDeniedIp(request.ip)) {
      log.info(
        { ip: request.ip, action: "postChatMessage" },
        "Denied a listed IP",
      );
      return {
        status: "error",
        error: "Posting from your network is blocked.",
      };
    }

    const identifier = request.ip ?? username;
    const result = await rateLimit(`postChatMessage:${identifier}`, RATE_LIMIT);

    if (!result.success) {
      return {
        status: "error",
        error: `Rate limit exceeded. Wait ${result.retryAfterSeconds} seconds before trying again.`,
      };
    }

    const messageId = await postChannelMessage(text, username, replyToId);

    await dismissChatTip();

    log.info(
      { username, messageId, ip: request.ip, action: "postChatMessage" },
      text,
    );

    return { status: "ok" };
  } catch (err) {
    log.error({ err, action: "postChatMessage" }, "Error posting chat message");
    return { status: "error", error: "Failed to post chat message" };
  }
}

const REACTION_RATE_LIMIT = { limit: 10, windowMs: 30_000 };

export type ReactToChatMessageResult =
  | { status: "ok" }
  | { status: "error"; error: string };

export async function reactToChatMessage(
  messageId: string,
  emoji: string,
): Promise<ReactToChatMessageResult> {
  try {
    const id = z.string().regex(/^\d+$/).parse(messageId);
    const reaction = EmojiSchema.parse(emoji);

    const { username } = await getSession();

    const request = await identifiers();
    if (request.ip !== undefined && isDeniedIp(request.ip)) {
      return {
        status: "error",
        error: "Reacting from your network is blocked.",
      };
    }

    const result = await rateLimit(
      `reactToChatMessage:${request.ip ?? username}`,
      REACTION_RATE_LIMIT,
    );
    if (!result.success) {
      return {
        status: "error",
        error: `Rate limit exceeded. Wait ${result.retryAfterSeconds} seconds before trying again.`,
      };
    }

    const change = await toggleReaction(id, reaction, username);
    log.info(
      {
        username,
        messageId: id,
        emoji: reaction,
        change,
        action: "reactToChatMessage",
      },
      "Toggled reaction",
    );

    updateTag("getChatHistory");
    refresh();
    return { status: "ok" };
  } catch (err) {
    log.error(
      { err, action: "reactToChatMessage" },
      "Error reacting to chat message",
    );
    return { status: "error", error: "Failed to react to chat message" };
  }
}
