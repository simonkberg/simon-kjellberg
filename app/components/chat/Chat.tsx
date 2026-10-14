"use client";

import { use, useState, useTransition } from "react";

import { type ChatHistoryResult, reactToChatMessage } from "@/actions/chat";
import ChatMessage from "@/components/chat/ChatMessage";
import { Subtitle } from "@/components/Subtitle";
import type { Message } from "@/lib/discord/api";

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
  const [reactionError, setReactionError] = useState<string>();

  const react = (messageId: string, emoji: string) => {
    startReacting(async () => {
      const reaction = await reactToChatMessage(messageId, emoji);
      setReactionError(
        reaction.status === "error" ? reaction.error : undefined,
      );
    });
  };

  if (result.status === "error") {
    return <p>Chat is temporarily unavailable :(</p>;
  }

  // @v8
  const replyToMessage = replyToId
    ? findMessageById(result.messages, replyToId)
    : null;

  return (
    <ChatReactionsContext
      value={{ username: currentUsername, pending: reacting, react }}
    >
      <ChatToast variant="error" message={reactionError} />
      <ChatHistory
        messages={result.messages}
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
