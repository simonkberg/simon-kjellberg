import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { admit } from "@/lib/admit";
import { DiscordApiError } from "@/lib/discord/api";
import { identifiers } from "@/lib/identifiers";
import { log } from "@/lib/log";
import type { ReactionResult } from "@/lib/reactionResult";
import {
  addReaction,
  EmojiSchema,
  MessageIdSchema,
  removeReaction,
} from "@/lib/reactions";
import { decrypt } from "@/lib/session";

// The state to set, not a toggle, so a repeated or crossed request can't flip it back.
const BodySchema = z.object({
  messageId: MessageIdSchema,
  emoji: EmojiSchema,
  mine: z.boolean(),
});

// Each click counts, and trying a few emoji on and off is quick.
const REACTION_RATE_LIMIT = { limit: 30, windowMs: 60_000 };
// Discord's "Maximum number of reactions reached (20)".
const MAX_REACTIONS_CODE = 30010;
const FAILED: ReactionResult = {
  status: "error",
  error: "Failed to react to chat message",
};

function respond(result: ReactionResult, status = 200) {
  return NextResponse.json(result, { status });
}

export async function POST(request: NextRequest) {
  // Next checks this for server actions; a route handler needs its own against CSRF.
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  if (origin === null || URL.parse(origin)?.host !== host) {
    log.warn({ origin, host, action: "reactToChatMessage" }, "Refused origin");
    return respond(
      { status: "error", error: "Reactions only come from this site" },
      403,
    );
  }

  // The proxy doesn't run on /api, so a visitor without a page's session has none.
  const session = await decrypt(request.cookies.get("session")?.value);
  if (!session) {
    return respond({ status: "error", error: "Reload the page to react" }, 401);
  }

  const { username } = session;
  try {
    const { ip } = await identifiers();
    const denied = await admit(
      "reactToChatMessage",
      "Reacting",
      ip,
      username,
      REACTION_RATE_LIMIT,
    );
    if (denied) return respond(denied.result, denied.httpStatus);

    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      log.warn(
        { err: parsed.error, action: "reactToChatMessage" },
        "Malformed reaction",
      );
      return respond(FAILED, 400);
    }
    const { messageId, emoji, mine } = parsed.data;

    await (mine ? addReaction : removeReaction)(messageId, emoji, username);
    log.info(
      { username, messageId, emoji, mine, action: "reactToChatMessage" },
      "Set reaction",
    );

    revalidateTag("getChatHistory", { expire: 0 });
    return respond({ status: "ok", savedAt: Date.now() });
  } catch (err) {
    if (err instanceof DiscordApiError && err.code === MAX_REACTIONS_CODE) {
      return respond(
        { status: "error", error: "Discord allows 20 emoji per message" },
        400,
      );
    }
    log.error(
      { err, action: "reactToChatMessage" },
      "Error reacting to chat message",
    );
    return respond(FAILED, 500);
  }
}
