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
  reactionsClock,
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

// A reaction is under 100 characters; a server action had Next's 1MB cap, a route has none.
const MAX_BODY_LENGTH = 1024;

function respond(result: ReactionResult, status = 200) {
  return NextResponse.json(result, { status });
}

async function readJson(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    if (text.length > MAX_BODY_LENGTH) {
      await reader.cancel();
      return null;
    }
  }
  return JSON.parse(text + decoder.decode());
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

    const parsed = BodySchema.safeParse(
      await readJson(request).catch(() => null),
    );
    if (!parsed.success) {
      log.warn(
        { err: parsed.error, action: "reactToChatMessage" },
        "Malformed reaction",
      );
      return respond(FAILED, 400);
    }
    const { messageId, emoji, mine } = parsed.data;

    try {
      await (mine ? addReaction : removeReaction)(messageId, emoji, username);
    } finally {
      // Expired on failure too, as the write may have landed before what threw.
      revalidateTag("getChatHistory", { expire: 0 });
    }
    log.info(
      { username, messageId, emoji, mine, action: "reactToChatMessage" },
      "Set reaction",
    );
    // The reaction is saved either way, so a failed read only leaves it undated.
    const savedAt = await reactionsClock().catch((err: unknown) => {
      log.warn({ err, action: "reactToChatMessage" }, "Failed to read clock");
      return null;
    });
    return respond({ status: "ok", savedAt });
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
