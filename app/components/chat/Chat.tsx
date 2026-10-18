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
    (typeof body.savedAt === "number" || body.savedAt === null)
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
  const failed = "Failed to react to chat message";
  try {
    const response = await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji, mine }),
      // Past the rate-limit gate's 30s, so only a hung connection gives up.
      signal: AbortSignal.timeout(45_000),
    });
    const result = readResult(
      await response.json().catch(() => null),
      response.ok,
    );
    // A server error may follow a write that landed, so only a 4xx rejects for sure.
    if (result?.status === "ok" || (result && response.status < 500)) {
      return result;
    }
    return {
      status: "unknown",
      error: result?.error ?? `${failed} (HTTP ${response.status})`,
    };
  } catch {
    return { status: "unknown", error: failed };
  }
}

interface SavedReaction extends OwnReaction {
  messageId: string;
  // Null when the outcome is unknown or Turso couldn't date it.
  savedAt: number | null;
  // The history shown when it settled.
  heldOver?: ChatHistoryResult;
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
  // What the route saved or may have, shown over any history read before it.
  const [saved, setSaved] = useState(NONE_SAVED);
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();
  const fetchedAt =
    (result.status === "ok" ? result.fetchedAt : null) ?? Infinity;
  // Shown over the history it settled on and any read before its save. Without a
  // time on either side, only the next history to arrive can say if it was saved.
  const unseen = [...saved]
    .map(([key, own]) =>
      own.heldOver
        ? ([key, own] as const)
        : ([key, { ...own, heldOver: result }] as const),
    )
    .filter(
      ([, own]) =>
        own.heldOver === result || (own.savedAt ?? -Infinity) >= fetchedAt,
    );
  if (
    unseen.length < saved.size ||
    unseen.some(([key, own]) => own !== saved.get(key))
  ) {
    setSaved(new Map(unseen));
  }
  let messages = result.status === "ok" ? result.messages : [];
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
      if (reaction.status !== "error") {
        setSaved((current) =>
          new Map(current).set(`${messageId} ${emoji}`, {
            ...own,
            messageId,
            savedAt: reaction.status === "ok" ? reaction.savedAt : null,
          }),
        );
      }
      // A success leaves an earlier error to time out, as it may be another message's.
      if (reaction.status !== "ok") {
        setReactionError((previous) => ({
          message: reaction.error,
          count: (previous?.count ?? 0) + 1,
        }));
      }
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
