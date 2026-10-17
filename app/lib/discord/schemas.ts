import { z } from "zod";

// `id` is set for custom guild emoji, which the site can't render.
const EmojiSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
});

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
    .array(z.object({ count: z.number(), me: z.boolean(), emoji: EmojiSchema }))
    .optional(),
});

export type DiscordMessage = z.infer<typeof DiscordMessageSchema>;

const ChannelSchema = z.object({ channel_id: z.string() });

const ReactionEventSchema = ChannelSchema.extend({
  message_id: z.string(),
  user_id: z.string(),
  emoji: EmojiSchema,
});

/** The gateway events for the site's channel, as Discord dispatches them. */
export const ChannelEventSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("MESSAGE_CREATE"),
    d: DiscordMessageSchema.extend(ChannelSchema.shape),
  }),
  // An update can carry only the fields that changed, e.g. an embed unfurling.
  z.object({
    t: z.literal("MESSAGE_UPDATE"),
    d: DiscordMessageSchema.partial().extend({
      id: z.string(),
      ...ChannelSchema.shape,
    }),
  }),
  z.object({
    t: z.literal("MESSAGE_DELETE"),
    d: ChannelSchema.extend({ id: z.string() }),
  }),
  z.object({
    t: z.literal("MESSAGE_DELETE_BULK"),
    d: ChannelSchema.extend({ ids: z.array(z.string()) }),
  }),
  z.object({ t: z.literal("MESSAGE_REACTION_ADD"), d: ReactionEventSchema }),
  z.object({ t: z.literal("MESSAGE_REACTION_REMOVE"), d: ReactionEventSchema }),
  z.object({
    t: z.literal("MESSAGE_REACTION_REMOVE_ALL"),
    d: ChannelSchema.extend({ message_id: z.string() }),
  }),
  z.object({
    t: z.literal("MESSAGE_REACTION_REMOVE_EMOJI"),
    d: ChannelSchema.extend({ message_id: z.string(), emoji: EmojiSchema }),
  }),
]);

export type ChannelEvent = z.infer<typeof ChannelEventSchema>;
