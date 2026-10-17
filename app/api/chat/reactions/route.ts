import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { admit } from "@/lib/admit";
import { DiscordApiError } from "@/lib/discord/api";
import { identifiers } from "@/lib/identifiers";
import { log } from "@/lib/log";
import { EmojiSchema, MessageIdSchema, toggleReaction } from "@/lib/reactions";
import { getSession } from "@/lib/session";

export type ReactionResult =
  | { status: "ok" }
  | { status: "error"; error: string };

const BodySchema = z.object({ messageId: MessageIdSchema, emoji: EmojiSchema });

// Each click counts, and trying a few emoji on and off is quick.
const REACTION_RATE_LIMIT = { limit: 30, windowMs: 60_000 };
// Discord's "Maximum number of reactions reached (20)".
const MAX_REACTIONS_CODE = 30010;

// Next checks this for server actions; a route handler needs its own against CSRF.
function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  return origin !== null && host !== null && URL.parse(origin)?.host === host;
}

function respond(result: ReactionResult, status = 200) {
  return NextResponse.json(result, { status });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const { username } = await getSession();

    const { ip } = await identifiers();
    const denied = await admit(
      "reactToChatMessage",
      "Reacting",
      ip,
      username,
      REACTION_RATE_LIMIT,
    );
    if (denied) return respond(denied, 429);

    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return respond(
        { status: "error", error: "Failed to react to chat message" },
        400,
      );
    }
    const { messageId, emoji } = parsed.data;

    const change = await toggleReaction(messageId, emoji, username);
    log.info(
      { username, messageId, emoji, change, action: "reactToChatMessage" },
      "Toggled reaction",
    );

    revalidateTag("getChatHistory", { expire: 0 });
    return respond({ status: "ok" });
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
    return respond(
      { status: "error", error: "Failed to react to chat message" },
      500,
    );
  }
}
