"use client";

import { refreshClientCache } from "@/actions/cache";
import type { ChatHistoryResult } from "@/actions/chat";
import type { BaseMessage, Message } from "@/lib/slack";
import { animated, useTransition } from "@react-spring/web";
import { use, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

interface ChatHistoryMessagesProps {
  messages: (Message | BaseMessage)[];
  nested?: boolean;
}

const ChatHistoryMessages = ({
  messages,
  nested = false,
}: ChatHistoryMessagesProps) => {
  const transitions = useTransition(messages, {
    keys: (message) => message.ts,
    initial: { opacity: nested ? 1 : 0, x: 0 },
    from: { opacity: 0, x: -100 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: 100 },
  });

  return (
    <>
      {transitions((style, item) => (
        <animated.li
          style={{
            opacity: style.opacity,
            transform: style.x.to((x) => `translateX(${x}%)`),
          }}
        >
          <ChatMessage {...item} />
          {"replies" in item && (
            <ul>
              <ChatHistoryMessages messages={item.replies} nested />
            </ul>
          )}
        </animated.li>
      ))}
    </>
  );
};

export interface ChatHistoryProps {
  history: Promise<ChatHistoryResult>;
  loading?: boolean;
  error?: boolean;
}

export const ChatHistory = ({ history }: ChatHistoryProps) => {
  const result = use(history);

  useEffect(() => {
    const eventSource = new EventSource("/api/chat/sse");

    eventSource.addEventListener("message", refreshClientCache);

    return () => eventSource.removeEventListener("message", refreshClientCache);
  }, []);

  if (result.status === "error") {
    return <p>Chat is temporarily unavailable :(</p>;
  }

  return (
    <div className="chat-history">
      <div className="scrollable">
        <ul className="content">
          <ChatHistoryMessages messages={result.messages} />
        </ul>
      </div>
    </div>
  );
};
