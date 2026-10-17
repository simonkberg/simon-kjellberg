/** What `/api/chat/reactions` answers a toggle with. */
export type ReactionResult =
  | { status: "ok" }
  | { status: "error"; error: string };
