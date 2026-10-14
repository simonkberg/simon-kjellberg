import "server-only";
import { z } from "zod";

import {
  addBotReaction,
  type Reaction,
  removeBotReaction,
} from "@/lib/discord/api";
import {
  notifySubscribers,
  type ReactionClear,
  subscribeToReactionClears,
} from "@/lib/discord/gateway";
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
    // The site counts from Turso, so a stale mirror only shows on Discord.
    await dropMirrorIfUnused(messageId, emoji).catch((err: unknown) => {
      log.warn({ err, messageId, emoji }, "Failed to remove bot reaction");
    });
    notifySubscribers();
    return "removed";
  }

  await addReaction(messageId, emoji, username);
  return "added";
}

/** Adds a reaction and mirrors it on Discord; adding one that's already there changes nothing. */
export async function addReaction(
  messageId: string,
  emoji: string,
  username: Username,
): Promise<void> {
  // The row goes in first so a concurrent removal counts it and keeps the mirror.
  const inserted = await query(
    "INSERT INTO reactions (message_id, emoji, username) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
    [messageId, emoji, username],
  );
  try {
    // Discord turns away a message or emoji it doesn't know.
    await addBotReaction(messageId, emoji);
  } catch (err) {
    // A concurrent request owns a row this insert didn't create.
    if (inserted.rowsAffected === 0) throw err;
    await query(
      "DELETE FROM reactions WHERE message_id = ? AND emoji = ? AND username = ?",
      [messageId, emoji, username],
    ).catch((rollbackErr: unknown) => {
      log.error(
        { err: rollbackErr, messageId, emoji },
        "Failed to roll back an unmirrored reaction",
      );
    });
    throw err;
  }
  notifySubscribers();
}

async function countReactions(messageId: string, emoji: string) {
  const { rows } = await query(
    "SELECT count(*) AS n FROM reactions WHERE message_id = ? AND emoji = ?",
    [messageId, emoji],
  );
  return Number(rows[0]?.["n"]);
}

async function dropMirrorIfUnused(messageId: string, emoji: string) {
  if ((await countReactions(messageId, emoji)) > 0) return;
  await removeBotReaction(messageId, emoji);
  // An add between the count and the removal kept its row but found the mirror in place.
  if ((await countReactions(messageId, emoji)) > 0) {
    await addBotReaction(messageId, emoji);
  }
}

/** Drops the site's rows for reactions Discord cleared, so they don't outlive the message or a moderator's clear. */
export async function clearReactions({
  messageId,
  emoji,
}: ReactionClear): Promise<void> {
  await query(
    "DELETE FROM reactions WHERE message_id = ? AND (? IS NULL OR emoji = ?)",
    [messageId, emoji, emoji],
  );
}

export function startReactionCleanup(): void {
  subscribeToReactionClears((clear) => {
    // The gateway's own refresh may read the rows before they're gone.
    clearReactions(clear).then(notifySubscribers, (err: unknown) => {
      log.error({ err, ...clear }, "Failed to clear reactions");
    });
  });
}

type Reactable<T> = { id: string; reactions: Reaction[]; replies?: T[] };
type SiteReactions = Map<string, Map<string, string[]>>;

function collectIds<T extends Reactable<T>>(
  items: T[],
  ids: string[] = [],
): string[] {
  for (const item of items) {
    ids.push(item.id);
    collectIds(item.replies ?? [], ids);
  }
  return ids;
}

function mergeReactions<T extends Reactable<T>>(
  items: T[],
  site: SiteReactions,
): T[] {
  return items.map((item) => {
    const users = site.get(item.id) ?? new Map<string, string[]>();
    const reactions: Reaction[] = item.reactions.map((reaction) => {
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
    return item.replies
      ? { ...item, reactions, replies: mergeReactions(item.replies, site) }
      : { ...item, reactions };
  });
}

/** Adds the site's reactions to the Discord ones; on failure the Discord ones still show. */
export async function withSiteReactions<T extends Reactable<T>>(
  items: T[],
): Promise<T[]> {
  const ids = collectIds(items);
  if (ids.length === 0) return items;

  try {
    const { rows } = await query(
      `SELECT message_id, emoji, username FROM reactions
       WHERE message_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY id`,
      ids,
    );

    const site: SiteReactions = new Map();
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

    return mergeReactions(items, site);
  } catch (err) {
    log.error({ err }, "Failed to load reactions");
    return items;
  }
}
