import "server-only";
import { log } from "@/lib/log";

import type { GatewayEvent } from "./gateway";
import type { ChannelEvent, DiscordMessage } from "./schemas";

/** Where the store gets what the gateway can't tell it. */
export type StoreSource = {
  /** The channel's latest messages, oldest first. */
  fetchMessages(): Promise<DiscordMessage[]>;
  /** Who reacted with an emoji, bots left out. */
  fetchReactorIds(messageId: string, emoji: string): Promise<string[]>;
  /** A member's display name, or `undefined` for someone no longer in the server. */
  fetchMemberName(userId: string): Promise<string | undefined>;
  botUserId(): string | null;
};

type Reaction = NonNullable<DiscordMessage["reactions"]>[number];
type Emoji = Reaction["emoji"];

export const WINDOW = 100;
// A seed is retried when an event lands during it; past this it keeps what it got.
const MAX_SEED_ATTEMPTS = 3;

function isShown(message: DiscordMessage): boolean {
  return message.type === 0 || message.type === 19;
}

function displayName(
  user: {
    username?: string | undefined;
    global_name?: string | null | undefined;
  },
  member?: { nick?: string | null | undefined },
): string | undefined {
  return member?.nick ?? user.global_name ?? user.username;
}

/** The channel's latest messages, seeded over REST and kept current by gateway events. */
export class ChannelStore {
  #source: StoreSource;
  #messages = new Map<string, DiscordMessage>();
  // Per message, per emoji: who reacted, once known. A reaction the gateway saw start is always known.
  #reactors = new Map<string, Map<string, Set<string>>>();
  #reactorFetches = new Map<string, Promise<string[]>>();
  #names = new Map<string, Promise<string | undefined>>();
  #seeding: Promise<void> | null = null;
  #seeded = false;
  // Set while what the store holds may have missed events; the next read seeds again.
  #stale = false;
  #changed = false;
  #listeners = new Set<() => void>();

  constructor(source: StoreSource) {
    this.#source = source;
  }

  /** Calls back whenever what the store holds may have changed, a fresh seed included. */
  listen(callback: () => void): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  #notify(): void {
    for (const callback of this.#listeners) {
      try {
        callback();
      } catch (err) {
        log.error({ err }, "Channel store listener error");
      }
    }
  }

  async messages(): Promise<DiscordMessage[]> {
    if (!this.#seeded) await this.#seed();
    else if (this.#stale && !this.#seeding) this.#reseed();
    return [...this.#messages.values()];
  }

  /** A message in the window, if the store has been seeded. */
  message(id: string): DiscordMessage | undefined {
    return this.#messages.get(id);
  }

  async reactorIds(messageId: string, emoji: string): Promise<string[]> {
    const known = this.#reactors.get(messageId)?.get(emoji);
    if (known) return [...known];

    const key = `${messageId}/${emoji}`;
    let fetch = this.#reactorFetches.get(key);
    if (!fetch) {
      fetch = this.#source.fetchReactorIds(messageId, emoji);
      this.#reactorFetches.set(key, fetch);
      void fetch.then(
        (ids) => {
          // An event since the fetch began has made it stale.
          if (this.#reactorFetches.get(key) !== fetch) return;
          this.#reactorFetches.delete(key);
          if (this.#messages.has(messageId)) {
            this.#reactorsOf(messageId).set(emoji, new Set(ids));
          }
        },
        () => this.#reactorFetches.delete(key),
      );
    }
    const ids = await fetch;
    // An event may have settled who reacted while this fetch was out.
    return [...(this.#reactors.get(messageId)?.get(emoji) ?? ids)];
  }

  memberName(userId: string): Promise<string | undefined> {
    let name = this.#names.get(userId);
    if (!name) {
      name = this.#source.fetchMemberName(userId);
      this.#names.set(userId, name);
      name.catch(() => this.#names.delete(userId));
    }
    return name;
  }

  apply(event: GatewayEvent): void {
    if (event.t === "READY") {
      // A new session means missed events are gone, so the window is fetched again,
      // and a seed already in flight may predate the gap.
      this.#changed = true;
      this.#reseed();
      return;
    }

    this.#changed = true;
    // Unseeded, the next seed includes it; the refresh this triggers is what reads it.
    if (this.#seeded) this.#applyEvent(event);
    this.#notify();
  }

  #applyEvent(event: ChannelEvent): void {
    switch (event.t) {
      case "MESSAGE_CREATE": {
        const { member, ...message } = event.d;
        // Without `member` there's no nick, and a name looked up with one would be lost.
        if (member && !message.author.bot) {
          this.#rememberName(
            message.author.id,
            displayName(message.author, member),
          );
        }
        if (!isShown(message)) return;
        this.#messages.set(message.id, message);
        for (const id of this.#messages.keys()) {
          if (this.#messages.size <= WINDOW) break;
          this.#delete(id);
        }
        return;
      }
      case "MESSAGE_UPDATE": {
        const existing = this.#messages.get(event.d.id);
        if (!existing) return;
        const { reactions: _, ...update } = event.d;
        this.#messages.set(existing.id, { ...existing, ...update });
        return;
      }
      case "MESSAGE_DELETE":
        this.#delete(event.d.id);
        return;
      case "MESSAGE_DELETE_BULK":
        for (const id of event.d.ids) this.#delete(id);
        return;
      case "MESSAGE_REACTION_ADD": {
        const { member, message_id, user_id, emoji } = event.d;
        if (member && !member.user.bot) {
          this.#rememberName(user_id, displayName(member.user, member));
        }
        // Bots aren't named, matching who REST lists as reacting.
        this.#react(message_id, emoji, user_id, 1, member?.user.bot === true);
        return;
      }
      case "MESSAGE_REACTION_REMOVE": {
        const { message_id, user_id, emoji } = event.d;
        this.#react(message_id, emoji, user_id, -1, false);
        return;
      }
      case "MESSAGE_REACTION_REMOVE_ALL":
        this.#updateReactions(event.d.message_id, () => []);
        this.#reactors.delete(event.d.message_id);
        return;
      case "MESSAGE_REACTION_REMOVE_EMOJI": {
        const { message_id, emoji } = event.d;
        if (emoji.name === null) return;
        this.#updateReactions(message_id, (reactions) =>
          reactions.filter((r) => !sameEmoji(r.emoji, emoji)),
        );
        this.#forgetReactors(message_id, emoji.name);
        return;
      }
    }
  }

  #reseed(): void {
    this.#stale = true;
    this.#seed().catch((err: unknown) => {
      log.error({ err }, "Failed to seed the channel store");
    });
  }

  #seed(): Promise<void> {
    return (this.#seeding ??= this.#load().finally(() => {
      this.#seeding = null;
    }));
  }

  async #load(): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      this.#changed = false;
      const messages = await this.#source.fetchMessages();
      if (this.#changed && attempt < MAX_SEED_ATTEMPTS) continue;
      if (this.#changed) {
        log.warn({ attempt }, "Seeded the channel store while it was changing");
      }

      this.#messages = new Map(
        messages
          .filter(isShown)
          .slice(-WINDOW)
          .map((m) => [m.id, m]),
      );
      this.#reactors.clear();
      this.#reactorFetches.clear();
      // Names refresh once a session, which bounds how long a missed nick change lasts.
      this.#names.clear();
      this.#seeded = true;
      this.#stale = this.#changed;
      this.#notify();
      return;
    }
  }

  #rememberName(userId: string, name: string | undefined): void {
    if (name !== undefined) this.#names.set(userId, Promise.resolve(name));
  }

  #delete(id: string): void {
    this.#messages.delete(id);
    this.#reactors.delete(id);
  }

  #reactorsOf(messageId: string): Map<string, Set<string>> {
    let reactors = this.#reactors.get(messageId);
    if (!reactors) this.#reactors.set(messageId, (reactors = new Map()));
    return reactors;
  }

  #forgetReactors(messageId: string, emoji: string): void {
    this.#reactors.get(messageId)?.delete(emoji);
    this.#reactorFetches.delete(`${messageId}/${emoji}`);
  }

  #updateReactions(
    messageId: string,
    update: (reactions: Reaction[]) => Reaction[],
  ): void {
    const message = this.#messages.get(messageId);
    if (message) {
      this.#messages.set(messageId, {
        ...message,
        reactions: update(message.reactions ?? []),
      });
    }
  }

  #react(
    messageId: string,
    emoji: Emoji,
    userId: string,
    delta: 1 | -1,
    fromBot: boolean,
  ) {
    // Custom guild emoji never show on the site.
    if (emoji.id !== null || emoji.name === null) return;
    const message = this.#messages.get(messageId);
    if (!message) return;

    const name = emoji.name;
    const reactions = message.reactions ?? [];
    const reaction = reactions.find((r) => sameEmoji(r.emoji, emoji));
    if (!reaction && delta < 0) return;

    const count = (reaction?.count ?? 0) + delta;
    if (count <= 0) {
      this.#messages.set(messageId, {
        ...message,
        reactions: reactions.filter((r) => r !== reaction),
      });
      this.#forgetReactors(messageId, name);
      return;
    }

    const isBot = userId === this.#source.botUserId();
    const next = {
      count,
      me: isBot ? delta > 0 : (reaction?.me ?? false),
      emoji,
    };
    this.#messages.set(messageId, {
      ...message,
      reactions: reaction
        ? reactions.map((r) => (r === reaction ? next : r))
        : [...reactions, next],
    });

    // The gateway saw a new reaction start, so it knows everyone on it.
    if (!reaction) this.#reactorsOf(messageId).set(name, new Set());
    const reactors = this.#reactors.get(messageId)?.get(name);
    if (!reactors) {
      // A fetch already in flight would miss this event.
      this.#reactorFetches.delete(`${messageId}/${name}`);
    } else if (!isBot && !fromBot) {
      if (delta > 0) reactors.add(userId);
      else reactors.delete(userId);
    }
  }
}

function sameEmoji(a: Emoji, b: Emoji): boolean {
  return a.id === b.id && a.name === b.name;
}
