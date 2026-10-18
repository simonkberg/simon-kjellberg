import type { DiscordMessage } from "@/lib/discord/schemas";

type Reaction = NonNullable<DiscordMessage["reactions"]>[number];

// Posted by the bot for a site visitor, so the author is the content's prefix and needs no lookup.
export function message(
  id: string,
  overrides: Partial<DiscordMessage> = {},
): DiscordMessage {
  return {
    type: 0,
    id,
    author: { id: "user1", bot: true },
    content: "User: Hi",
    timestamp: "2025-01-01T00:00:00.000000+00:00",
    edited_timestamp: null,
    ...overrides,
  };
}

export function reaction(name: string, count = 1, me = false): Reaction {
  return { count, me, emoji: { id: null, name } };
}
