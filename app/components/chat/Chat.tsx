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
  username: string | null,
): Reaction[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [
      ...reactions,
      { emoji, count: 1, users: username ? [username] : [] },
    ];
  }
  const reacted = username !== null && existing.users.includes(username);
  return reactions
    .map((reaction) =>
      reaction !== existing
        ? reaction
        : reacted
          ? {
              ...reaction,
              count: reaction.count - 1,
              users: reaction.users.filter((user) => user !== username),
            }
          : {
              ...reaction,
              count: reaction.count + 1,
              users: username ? [...reaction.users, username] : reaction.users,
            },
    )
    .filter((reaction) => reaction.count > 0);
}

const withReactionToggled = (
  messages: Message[],
  messageId: string,
  emoji: string,
  username: string | null,
): Message[] =>
  messages.map((message) => ({
    ...message,
    reactions:
      message.id === messageId
        ? toggleOwnReaction(message.reactions, emoji, username)
        : message.reactions,
    replies: withReactionToggled(message.replies, messageId, emoji, username),
  }));

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
  const [reacting, startReacting] = useTransition();
  // Shown at once; the server's history replaces it when the action settles.
  const [messages, toggleOptimistically] = useOptimistic(
    result.status === "ok" ? result.messages : [],
    (current, { messageId, emoji }: { messageId: string; emoji: string }) =>
      withReactionToggled(current, messageId, emoji, currentUsername),
  );
  // Counted so the toast remounts and shows a repeated message again.
  const [reactionError, setReactionError] = useState<{
    message: string;
    count: number;
  }>();

  const react = (messageId: string, emoji: string) => {
    startReacting(async () => {
      toggleOptimistically({ messageId, emoji });
      const reaction = await reactToChatMessage(messageId, emoji).catch(
        () =>
          ({
            status: "error",
            error: "Failed to react to chat message",
          }) as const,
      );
      setReactionError((previous) =>
        reaction.status === "error"
          ? { message: reaction.error, count: (previous?.count ?? 0) + 1 }
          : undefined,
      );
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
      value={{ username: currentUsername, pending: reacting, react }}
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
