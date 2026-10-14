import { z } from "zod";

/**
 * Discord message schema - used by both gateway events and API responses.
 * Only includes fields we actually use.
 */
export const DiscordMessageSchema = z.object({
  type: z.number(),
  id: z.string(),
  channel_id: z.string().optional(), // Present in gateway events, not in API single-message fetch
  author: z.object({ id: z.string(), bot: z.boolean().optional() }),
  content: z.string(),
  timestamp: z.string(),
  edited_timestamp: z.string().nullable().optional(),
  message_reference: z.object({ message_id: z.string().optional() }).optional(),
  reactions: z
    .array(
      z.object({
        count: z.number(),
        me: z.boolean(),
        // `id` is set for custom guild emoji, which the site can't render.
        emoji: z.object({
          id: z.string().nullable(),
          name: z.string().nullable(),
        }),
      }),
    )
    .optional(),
});

export type DiscordMessage = z.infer<typeof DiscordMessageSchema>;
