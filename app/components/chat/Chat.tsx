"use client";

import { use, useOptimistic, useState, useTransition } from "react";

import { type ChatHistoryResult, reactToChatMessage } from "@/actions/chat";
import ChatMessage from "@/components/chat/ChatMessage";
import { Subtitle } from "@/components/Subtitle";
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

export interface ChatProps {
  history: Promise<ChatHistoryResult>;
  tipDismissed: Promise<boolean>;
}

export const Chat = ({ history, tipDismissed }: ChatProps) => {
  const result = use(history);
  const dismissed = use(tipDismissed);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [, startReacting] = useTransition();
  // Per message, so a slow toggle (Discord's rate limit can hold it 30s) blocks only its own.
  const [reacting, markReacting] = useOptimistic(
    new Set<string>(),
    (ids, messageId: string) => new Set(ids).add(messageId),
  );
  // Shown at once; the server's history replaces it when the action settles.
  const [messages, toggleOptimistically] = useOptimistic(
    result.status === "ok" ? result.messages : [],
    (current, { messageId, emoji }: { messageId: string; emoji: string }) =>
      withReactionToggled(current, messageId, emoji),
  );
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();

  const react = (messageId: string, emoji: string) => {
    startReacting(async () => {
      markReacting(messageId);
      toggleOptimistically({ messageId, emoji });
      const reaction = await reactToChatMessage(messageId, emoji).catch(
        () =>
          ({
            status: "error",
            error: "Failed to react to chat message",
          }) as const,
      );
      // After an await, updates leave the transition unless wrapped again.
      startReacting(() => {
        setReactionError((previous) =>
          reaction.status === "error"
            ? { message: reaction.error, count: (previous?.count ?? 0) + 1 }
            : undefined,
        );
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
          <button
            aria-label="Clear reply"
            title="Clear reply"
            className="clear"
            onClick={() => setReplyToId(null)}
          >
            &times;
          </button>
        </div>
      )}
      <ChatInput replyToId={replyToId} setReplyToId={setReplyToId}>
        {!dismissed && <ChatTip />}
      </ChatInput>
    </ChatReactionsContext>
  );
};
