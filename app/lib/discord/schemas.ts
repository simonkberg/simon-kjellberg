import { z } from "zod";

// `id` is set for custom guild emoji, which the site can't render.
const EmojiSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
});

const DiscordUserSchema = z.object({
  id: z.string(),
  bot: z.boolean().optional(),
  username: z.string().optional(),
  global_name: z.string().nullable().optional(),
});

const MemberSchema = z.object({ nick: z.string().nullable().optional() });

export const GuildMemberSchema = MemberSchema.extend({
  user: DiscordUserSchema.omit({ id: true }),
});

export function displayName(
  user: Omit<z.infer<typeof DiscordUserSchema>, "id">,
  member?: z.infer<typeof MemberSchema>,
): string | undefined {
  return member?.nick ?? user.global_name ?? user.username;
}

/**
 * Discord message schema - used by both gateway events and API responses.
 * Only includes fields we actually use.
 */
export const DiscordMessageSchema = z.object({
  type: z.number(),
  id: z.string(),
  channel_id: z.string().optional(), // Present in gateway events, not in API single-message fetch
  author: DiscordUserSchema,
  content: z.string(),
  timestamp: z.string(),
  edited_timestamp: z.string().nullable().optional(),
  message_reference: z
    .object({ type: z.number().optional(), message_id: z.string().optional() })
    .optional(),
  reactions: z
    .array(z.object({ count: z.number(), me: z.boolean(), emoji: EmojiSchema }))
    .optional(),
});

export type DiscordMessage = z.infer<typeof DiscordMessageSchema>;

// Default messages and replies; the rest are system messages.
export function isShown(message: DiscordMessage): boolean {
  return message.type === 0 || message.type === 19;
}

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
    d: DiscordMessageSchema.extend({
      ...ChannelSchema.shape,
      member: MemberSchema.optional(),
    }),
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
  z.object({
    t: z.literal("MESSAGE_REACTION_ADD"),
    d: ReactionEventSchema.extend({ member: GuildMemberSchema.optional() }),
  }),
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
