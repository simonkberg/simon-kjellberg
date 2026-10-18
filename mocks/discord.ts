import type { DiscordMessage } from "@/lib/discord/schemas";
import { mockEnv } from "@/mocks/env";

type Reaction = NonNullable<DiscordMessage["reactions"]>[number];

export function message(
  id: string,
  overrides: Partial<DiscordMessage> = {},
): DiscordMessage & { channel_id: string } {
  return {
    type: 0,
    id,
    channel_id: mockEnv.DISCORD_CHANNEL_ID,
    author: { id: "user-1", username: "user1" },
    content: "User: Hi",
    timestamp: "2025-01-01T00:00:00.000000+00:00",
    edited_timestamp: null,
    ...overrides,
  };
}

export function reaction(name: string, count = 1, me = false): Reaction {
  return { count, me, emoji: { id: null, name } };
}
