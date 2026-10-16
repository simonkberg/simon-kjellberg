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

function toggleOwnReaction(
  reactions: Reaction[],
  emoji: string,
  username: string,
): Reaction[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, users: [username] }];
  }
  const mine = existing.users.includes(username);
  const updated = {
    ...existing,
    count: existing.count + (mine ? -1 : 1),
    users: mine
      ? existing.users.filter((user) => user !== username)
      : [...existing.users, username],
  };
  return reactions
    .map((reaction) => (reaction === existing ? updated : reaction))
    .filter((reaction) => reaction.count > 0);
}

function withReactionToggled(
  messages: Message[],
  messageId: string,
  emoji: string,
  username: string,
): Message[] {
  // Untouched messages keep their identity, so only the toggled one re-renders.
  return messages.map((message) => {
    if (message.id === messageId) {
      return {
        ...message,
        reactions: toggleOwnReaction(message.reactions, emoji, username),
      };
    }
    if (!findMessageById(message.replies, messageId)) return message;
    return {
      ...message,
      replies: withReactionToggled(message.replies, messageId, emoji, username),
    };
  });
}

export interface ChatProps {
  history: Promise<ChatHistoryResult>;
  tipDismissed: Promise<boolean>;
  username: Promise<string | null>;
}

export const Chat = ({ history, tipDismissed, username }: ChatProps) => {
  const result = use(history);
  const dismissed = use(tipDismissed);
  const currentUsername = use(username);
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
    (
      current,
      {
        messageId,
        emoji,
        username,
      }: { messageId: string; emoji: string; username: string },
    ) => withReactionToggled(current, messageId, emoji, username),
  );
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();

  const react = (messageId: string, emoji: string) => {
    startReacting(async () => {
      markReacting(messageId);
      // Without a session the server turns the reaction away.
      if (currentUsername !== null) {
        toggleOptimistically({ messageId, emoji, username: currentUsername });
      }
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
    <ChatReactionsContext
      value={{ username: currentUsername, reacting, react }}
    >
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
