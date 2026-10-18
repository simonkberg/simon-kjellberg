"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";

import type { ChatHistoryResult } from "@/actions/chat";
import ChatMessage from "@/components/chat/ChatMessage";
import { Subtitle } from "@/components/Subtitle";
import { TooltipButton } from "@/components/Tooltip";
import type { Message, Reaction } from "@/lib/discord/api";
import type { ReactionResult } from "@/lib/reactionResult";

import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";
import { ChatReactionsContext } from "./ChatReactions";
import { ChatTip } from "./ChatTip";
import { ChatToast } from "./ChatToast";

const findMessageById = (messages: Message[], id: string): Message | null => {
  for (const message of messages) {
    if (message.id === id) {
      return message;
    }
    const foundInReplies = findMessageById(message.replies, id);
    if (foundInReplies) {
      return foundInReplies;
    }
  }
  return null;
};

// The end state, not a toggle, so a history that already has it isn't flipped back.
interface OwnReaction {
  emoji: string;
  mine: boolean;
}

function setOwnReaction(
  reactions: Reaction[],
  { emoji, mine }: OwnReaction,
): Reaction[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return mine
      ? [...reactions, { emoji, count: 1, users: [], mine }]
      : reactions;
  }
  if (Boolean(existing.mine) === mine) return reactions;
  const updated = {
    ...existing,
    count: existing.count + (mine ? 1 : -1),
    mine,
  };
  return reactions
    .map((reaction) => (reaction === existing ? updated : reaction))
    .filter((reaction) => reaction.count > 0);
}

function withOwnReaction(
  messages: Message[],
  messageId: string,
  own: OwnReaction,
): Message[] {
  // Untouched messages keep their identity, so only the toggled one re-renders.
  return messages.map((message) => {
    if (message.id === messageId) {
      return { ...message, reactions: setOwnReaction(message.reactions, own) };
    }
    if (!findMessageById(message.replies, messageId)) return message;
    return {
      ...message,
      replies: withOwnReaction(message.replies, messageId, own),
    };
  });
}

/** The route's answer, or `unknown` when there was none to read and the toggle may have been saved. */
type ReactionOutcome = ReactionResult | { status: "unknown"; error: string };

function readResult(body: unknown, ok: boolean): ReactionResult | null {
  if (typeof body !== "object" || body === null || !("status" in body)) {
    return null;
  }
  if (
    ok &&
    body.status === "ok" &&
    "savedAt" in body &&
    typeof body.savedAt === "number"
  ) {
    return { status: "ok", savedAt: body.savedAt };
  }
  if (
    body.status === "error" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return { status: "error", error: body.error };
  }
  return null;
}

async function postReaction(
  messageId: string,
  { emoji, mine }: OwnReaction,
): Promise<ReactionOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji, mine }),
      // Past the rate-limit gate's 30s, so only a hung connection gives up.
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return { status: "unknown", error: "Failed to react to chat message" };
  }
  const result = readResult(
    await response.json().catch(() => null),
    response.ok,
  );
  return (
    result ?? {
      status: "unknown",
      error: response.ok
        ? "Failed to react to chat message"
        : `Failed to react to chat message (HTTP ${response.status})`,
    }
  );
}

interface SavedReaction extends OwnReaction {
  messageId: string;
  savedAt: number;
}

const NOT_REACTING: ReadonlyMap<string, OwnReaction> = new Map();
const NONE_SAVED: ReadonlyMap<string, SavedReaction> = new Map();

export interface ChatProps {
  history: Promise<ChatHistoryResult>;
  tipDismissed: Promise<boolean>;
}

export const Chat = ({ history, tipDismissed }: ChatProps) => {
  const result = use(history);
  const dismissed = use(tipDismissed);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const router = useRouter();
  // State, not an async transition: React holds every other transition until
  // one settles, and Discord's rate limit can hold a toggle 30s.
  const [pending, setPending] = useState(NOT_REACTING);
  // What the route saved, shown over any history read before it.
  const [saved, setSaved] = useState(NONE_SAVED);
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();
  const shown =
    result.status === "ok" ? result : { messages: [], fetchedAt: -Infinity };
  // A history read after a save already has it, so the save can go.
  const unseen = [...saved].filter(([, own]) => own.savedAt > shown.fetchedAt);
  if (unseen.length < saved.size) setSaved(new Map(unseen));
  let messages = shown.messages;
  for (const [, own] of unseen) {
    messages = withOwnReaction(messages, own.messageId, own);
  }
  for (const [messageId, own] of pending) {
    messages = withOwnReaction(messages, messageId, own);
  }

  const react = (messageId: string, emoji: string) => {
    // One request per message at a time, as its buttons are disabled while one is pending.
    if (pending.has(messageId)) return;
    const own = {
      emoji,
      mine: !findMessageById(messages, messageId)?.reactions.find(
        (reaction) => reaction.emoji === emoji,
      )?.mine,
    };
    setPending((current) => new Map(current).set(messageId, own));
    void postReaction(messageId, own).then((reaction) => {
      setPending((current) => {
        const next = new Map(current);
        next.delete(messageId);
        return next;
      });
      if (reaction.status === "ok") {
        const { savedAt } = reaction;
        setSaved((current) =>
          new Map(current).set(`${messageId} ${emoji}`, {
            ...own,
            messageId,
            savedAt,
          }),
        );
      }
      setReactionError((previous) =>
        reaction.status === "ok"
          ? undefined
          : { message: reaction.error, count: (previous?.count ?? 0) + 1 },
      );
      // A rejected request changed nothing; any other may have been saved.
      if (reaction.status !== "error") router.refresh();
    });
  };

  if (result.status === "error") {
    return <p>Chat is temporarily unavailable :(</p>;
  }

  // @v8
  const replyToMessage = replyToId
    ? findMessageById(messages, replyToId)
    : null;

  return (
    <ChatReactionsContext value={{ reacting: pending, react }}>
      <ChatToast
        key={reactionError?.count}
        variant="error"
        message={reactionError?.message}
      />
      <ChatHistory
        messages={messages}
        replyToId={replyToId}
        setReplyToId={setReplyToId}
      />
      {replyToMessage && (
        <div className="chat-replying-to" role="status" aria-live="polite">
          <Subtitle>Replying to</Subtitle>
          <ChatMessage
            replyToId={replyToId}
            setReplyToId={setReplyToId}
            {...replyToMessage}
            preview
          />
          <TooltipButton
            tooltip="Clear reply"
            className="clear"
            onClick={() => setReplyToId(null)}
          >
            &times;
          </TooltipButton>
        </div>
      )}
      <ChatInput replyToId={replyToId} setReplyToId={setReplyToId}>
        {!dismissed && <ChatTip />}
      </ChatInput>
    </ChatReactionsContext>
  );
};
