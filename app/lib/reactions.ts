import "server-only";
import { z } from "zod";

import { refreshChat, refreshChatUnlessEchoed } from "@/lib/chatUpdates";
import {
  addBotReaction,
  type Reaction,
  removeBotReaction,
} from "@/lib/discord/api";
import type { ReactionClear } from "@/lib/discord/gateway";
import { log } from "@/lib/log";
import type { Username } from "@/lib/session";
import { query } from "@/lib/turso";

/** One emoji as Discord stores a reaction's name; kept off the client, where older browsers can't parse the `v` flag. */
export const EmojiSchema = z.string().regex(/^\p{RGI_Emoji}$/v);

function deleteRow(messageId: string, emoji: string, username: Username) {
  return query(
    "DELETE FROM reactions WHERE message_id = ? AND emoji = ? AND username = ?",
    [messageId, emoji, username],
  );
}

/** Adds the visitor's reaction, or takes it back if they already reacted with that emoji. */
export async function toggleReaction(
  messageId: string,
  emoji: string,
  username: Username,
): Promise<"added" | "removed"> {
  const { rowsAffected } = await deleteRow(messageId, emoji, username);

  if (rowsAffected > 0) {
    // The site counts from Turso, so a stale mirror only shows on Discord.
    const mirrorChanged = await dropMirrorIfUnused(messageId, emoji).catch(
      (err: unknown) => {
        log.warn({ err, messageId, emoji }, "Failed to remove bot reaction");
        return false;
      },
    );
    if (!mirrorChanged) refreshChat();
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
  if (inserted.rowsAffected === 0) return;
  const first = (await countReactions(messageId, emoji)) === 1;
  const cancelFallback = first ? refreshChatUnlessEchoed() : undefined;
  try {
    // Discord turns away a message or emoji it doesn't know.
    await addBotReaction(messageId, emoji);
  } catch (err) {
    cancelFallback?.();
    await deleteRow(messageId, emoji, username).catch(
      (rollbackErr: unknown) => {
        log.error(
          { err: rollbackErr, messageId, emoji },
          "Failed to roll back an unmirrored reaction",
        );
      },
    );
    if (mayHaveLanded(err)) {
      void dropMirrorIfUnused(messageId, emoji).catch((dropErr: unknown) => {
        log.warn(
          { err: dropErr, messageId, emoji },
          "Failed to drop an unconfirmed bot reaction",
        );
      });
    }
    throw err;
  }
  // A mirror change comes back from the gateway to every replica, this one included.
  if (!first) refreshChat();
}

/** A PUT that timed out or lost its connection can still land after its row is gone. */
function mayHaveLanded(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "TimeoutError") ||
    (err instanceof TypeError && err.message === "fetch failed")
  );
}

async function countReactions(messageId: string, emoji: string) {
  const { rows } = await query(
    "SELECT count(*) AS n FROM reactions WHERE message_id = ? AND emoji = ?",
    [messageId, emoji],
  );
  return Number(rows[0]?.["n"]);
}

async function dropMirrorIfUnused(
  messageId: string,
  emoji: string,
): Promise<boolean> {
  if ((await countReactions(messageId, emoji)) > 0) return false;
  refreshChatUnlessEchoed();
  await removeBotReaction(messageId, emoji);
  // An add between the count and the removal kept its row but found the mirror in place.
  if ((await countReactions(messageId, emoji)) > 0) {
    // The next add puts the mirror back, so a failure here only lasts until then.
    await addBotReaction(messageId, emoji).catch((err: unknown) => {
      log.warn({ err, messageId, emoji }, "Failed to restore bot reaction");
    });
  }
  return true;
}

/** Drops the site's rows for reactions Discord cleared, so they don't outlive the message or a moderator's clear. */
export async function clearReactions({
  messageIds,
  emoji,
}: ReactionClear): Promise<void> {
  await query(
    "DELETE FROM reactions WHERE message_id IN (SELECT value FROM json_each(?)) AND (? IS NULL OR emoji = ?)",
    [JSON.stringify(messageIds), emoji, emoji],
  );
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
    const users = new Map(site.get(item.id));
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
       WHERE message_id IN (SELECT value FROM json_each(?))
       ORDER BY id`,
      [JSON.stringify(ids)],
    );

    const site: SiteReactions = new Map();
    for (const row of rows) {
      const messageId = String(row["message_id"]);
      const emoji = String(row["emoji"]);
      const byEmoji = site.get(messageId) ?? new Map<string, string[]>();
      site.set(messageId, byEmoji);
      const users = byEmoji.get(emoji) ?? [];
      byEmoji.set(emoji, users);
      users.push(String(row["username"]));
    }

    return mergeReactions(items, site);
  } catch (err) {
    log.error({ err }, "Failed to load reactions");
    return items;
  }
}
