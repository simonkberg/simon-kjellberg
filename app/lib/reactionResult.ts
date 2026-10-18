/** What `/api/chat/reactions` answers a toggle with: on success, the visitor's reaction as saved and when. */
export type ReactionResult =
  | { status: "ok"; mine: boolean; savedAt: number }
  | { status: "error"; error: string };
