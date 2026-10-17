import { z } from "zod";

/** What `/api/chat/reactions` answers a toggle with. */
export const ReactionResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok") }),
  z.object({ status: z.literal("error"), error: z.string() }),
]);

export type ReactionResult = z.infer<typeof ReactionResultSchema>;
