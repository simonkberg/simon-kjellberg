"use server";

import { cacheLife, cacheTag, refresh, updateTag } from "next/cache";
import { z } from "zod";

import { admit } from "@/lib/admit";
import { setChatTipDismissed } from "@/lib/chatTip";
import {
  getChannelMessages,
  type Message,
  postChannelMessage,
} from "@/lib/discord/api";
import { identifiers } from "@/lib/identifiers";
import { log } from "@/lib/log";
import { reactionsClock, withSiteReactions } from "@/lib/reactions";
import { getSession } from "@/lib/session";

export type ChatHistoryResult =
  | { status: "ok"; messages: Message[]; fetchedAt: number }
  | { status: "error"; error: string };

export async function getChatHistory(): Promise<ChatHistoryResult> {
  "use cache";
  cacheLife("seconds");
  cacheTag("getChatHistory");

  try {
    // Read before the reactions, so the history has every reaction saved before it.
    // Without the clock, Turso's reads likely fail too, so saved reactions show over it.
    const [fetchedAt, channel] = await Promise.all([
      reactionsClock().catch(() => -Infinity),
      getChannelMessages(),
    ]);
    const messages = await withSiteReactions(channel);
    return { status: "ok", messages, fetchedAt };
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
    const { username } = await getSession();

    // Admitted first, so malformed requests count against the limit too.
    const request = await identifiers();
    const denied = await admit(
      "postChatMessage",
      "Posting",
      request.ip,
      username,
      RATE_LIMIT,
    );
    if (denied) return denied.result;

    const text = z.string().trim().min(1).parse(formData.get("text"));
    const replyToId = z
      .string()
      .optional()
      .parse(formData.get("replyToId") ?? undefined);

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
