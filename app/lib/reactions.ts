import "server-only";
import { z } from "zod";

import {
  addBotReaction,
  type Message,
  type Reaction,
  removeBotReaction,
} from "@/lib/discord/api";
import { notifySubscribers } from "@/lib/discord/gateway";
import { log } from "@/lib/log";
import type { Username } from "@/lib/session";
import { query } from "@/lib/turso";

/** One emoji as Discord stores a reaction's name; kept off the client, where older browsers can't parse the `v` flag. */
export const EmojiSchema = z.string().regex(/^\p{RGI_Emoji}$/v);

/** Adds the visitor's reaction, or takes it back if they already reacted with that emoji. */
export async function toggleReaction(
  messageId: string,
  emoji: string,
  username: Username,
): Promise<"added" | "removed"> {
  const { rowsAffected } = await query(
    "DELETE FROM reactions WHERE message_id = ? AND emoji = ? AND username = ?",
    [messageId, emoji, username],
  );

  if (rowsAffected > 0) {
    const { rows } = await query(
      "SELECT count(*) AS n FROM reactions WHERE message_id = ? AND emoji = ?",
      [messageId, emoji],
    );
    if (Number(rows[0]?.["n"]) === 0) {
      // The site counts from Turso, so a stale mirror only shows on Discord.
      await removeBotReaction(messageId, emoji).catch((err: unknown) => {
        log.warn({ err, messageId, emoji }, "Failed to remove bot reaction");
      });
    }
    notifySubscribers();
    return "removed";
  }

  // The row goes in first so a concurrent removal counts it and keeps the mirror.
  await query(
    "INSERT INTO reactions (message_id, emoji, username) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
    [messageId, emoji, username],
  );
  try {
    // Discord turns away a message or emoji it doesn't know.
    await addBotReaction(messageId, emoji);
  } catch (err) {
    await query(
      "DELETE FROM reactions WHERE message_id = ? AND emoji = ? AND username = ?",
      [messageId, emoji, username],
    );
    throw err;
  }
  notifySubscribers();
  return "added";
}

function collectIds(messages: Message[], ids: string[] = []): string[] {
  for (const message of messages) {
    ids.push(message.id);
    collectIds(message.replies, ids);
  }
  return ids;
}

function mergeReactions(
  messages: Message[],
  site: Map<string, Map<string, string[]>>,
): Message[] {
  return messages.map((message) => {
    const users = site.get(message.id) ?? new Map<string, string[]>();
    const reactions: Reaction[] = message.reactions.map((reaction) => {
      const siteUsers = users.get(reaction.emoji) ?? [];
      users.delete(reaction.emoji);
      return {
        ...reaction,
        count: reaction.count + siteUsers.length,
        users: siteUsers,
      };
    });
    for (const [emoji, siteUsers] of users) {
      reactions.push({ emoji, count: siteUsers.length, users: siteUsers });
    }
    return {
      ...message,
      reactions,
      replies: mergeReactions(message.replies, site),
    };
  });
}

/** Adds the site's reactions to the Discord ones; on failure the Discord ones still show. */
export async function withSiteReactions(
  messages: Message[],
): Promise<Message[]> {
  const ids = collectIds(messages);
  if (ids.length === 0) return messages;

  try {
    const { rows } = await query(
      `SELECT message_id, emoji, username FROM reactions
       WHERE message_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY id`,
      ids,
    );

    const site = new Map<string, Map<string, string[]>>();
    for (const row of rows) {
      const messageId = String(row["message_id"]);
      const emoji = String(row["emoji"]);
      const byEmoji = site.get(messageId) ?? new Map<string, string[]>();
      site.set(messageId, byEmoji);
      byEmoji.set(emoji, [
        ...(byEmoji.get(emoji) ?? []),
        String(row["username"]),
      ]);
    }

    return mergeReactions(messages, site);
  } catch (err) {
    log.error({ err }, "Failed to load reactions");
    return messages;
  }
}
