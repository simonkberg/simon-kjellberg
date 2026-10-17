"use client";

import { useRouter } from "next/navigation";
import { startTransition, use, useState } from "react";

import type { ChatHistoryResult } from "@/actions/chat";
import type { ReactionResult } from "@/api/chat/reactions/route";
import ChatMessage from "@/components/chat/ChatMessage";
import { Subtitle } from "@/components/Subtitle";
import { TooltipButton } from "@/components/Tooltip";
import type { Message, Reaction } from "@/lib/discord/api";

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

function toggleOwnReaction(reactions: Reaction[], emoji: string): Reaction[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, users: [], mine: true }];
  }
  const updated = {
    ...existing,
    count: existing.count + (existing.mine ? -1 : 1),
    mine: !existing.mine,
  };
  return reactions
    .map((reaction) => (reaction === existing ? updated : reaction))
    .filter((reaction) => reaction.count > 0);
}

function withReactionToggled(
  messages: Message[],
  messageId: string,
  emoji: string,
): Message[] {
  // Untouched messages keep their identity, so only the toggled one re-renders.
  return messages.map((message) => {
    if (message.id === messageId) {
      return {
        ...message,
        reactions: toggleOwnReaction(message.reactions, emoji),
      };
    }
    if (!findMessageById(message.replies, messageId)) return message;
    return {
      ...message,
      replies: withReactionToggled(message.replies, messageId, emoji),
    };
  });
}

async function postReaction(
  messageId: string,
  emoji: string,
): Promise<ReactionResult> {
  try {
    const response = await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
    return (await response.json()) as ReactionResult;
  } catch {
    return { status: "error", error: "Failed to react to chat message" };
  }
}

const NOT_REACTING: ReadonlyMap<string, string> = new Map();

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
  const reacting = new Set(pending.keys());
  let messages = result.status === "ok" ? result.messages : [];
  for (const [messageId, emoji] of pending) {
    messages = withReactionToggled(messages, messageId, emoji);
  }
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();

  const react = (messageId: string, emoji: string) => {
    setPending((current) => new Map(current).set(messageId, emoji));
    void postReaction(messageId, emoji).then((reaction) => {
      // One transition, so the toggle shows until the refreshed history replaces it.
      startTransition(() => {
        setPending((current) => {
          const next = new Map(current);
          next.delete(messageId);
          return next;
        });
        setReactionError((previous) =>
          reaction.status === "error"
            ? { message: reaction.error, count: (previous?.count ?? 0) + 1 }
            : undefined,
        );
        if (reaction.status === "ok") router.refresh();
      });
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
    <ChatReactionsContext value={{ reacting, react }}>
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
