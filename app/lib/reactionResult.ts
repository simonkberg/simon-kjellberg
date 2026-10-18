/** A request turned away, with the reason to show the visitor. */
export type ErrorResult = { status: "error"; error: string };

/** What `/api/chat/reactions` answers with: on success, when the reaction was saved. */
export type ReactionResult = { status: "ok"; savedAt: number } | ErrorResult;
