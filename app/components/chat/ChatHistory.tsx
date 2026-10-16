"use client";

import { animated, useTransition } from "@react-spring/web";
import {
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type SetStateAction,
  useState,
} from "react";

import type { Message } from "@/lib/discord/api";

import { ChatMessage } from "./ChatMessage";

const messageIds = (messages: Message[]): string[] =>
  messages.flatMap((message) => [message.id, ...messageIds(message.replies)]);

function focusTarget(
  messages: HTMLElement[],
  current: number,
  key: string,
): HTMLElement | undefined {
  switch (key) {
    case "ArrowUp":
      return messages[current - 1];
    case "ArrowDown":
      return messages[current + 1];
    case "Home":
      return messages[0];
    case "End":
      return messages.at(-1);
    default:
      return undefined;
  }
}

interface ChatHistoryMessagesProps {
  messages: Message[];
  tabStop: string | undefined;
  replyToId: string | null;
  setReplyToId: Dispatch<SetStateAction<string | null>>;
  nested?: boolean;
}

const ChatHistoryMessages = ({
  messages,
  nested = false,
  tabStop,
  replyToId,
  setReplyToId,
}: ChatHistoryMessagesProps) => {
  const transitions = useTransition(messages, {
    keys: (message) => message.id,
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
          <ChatMessage
            {...item}
            active={item.id === tabStop}
            replyToId={replyToId}
            setReplyToId={setReplyToId}
          />
          {item.replies.length > 0 && (
            <ul>
              <ChatHistoryMessages
                messages={item.replies}
                tabStop={tabStop}
                replyToId={replyToId}
                setReplyToId={setReplyToId}
                nested
              />
            </ul>
          )}
        </animated.li>
      ))}
    </>
  );
};

export interface ChatHistoryProps {
  messages: Message[];
  replyToId: string | null;
  setReplyToId: Dispatch<SetStateAction<string | null>>;
}

export const ChatHistory = ({
  messages,
  replyToId,
  setReplyToId,
}: ChatHistoryProps) => {
  const [focusedId, setFocusedId] = useState<string>();
  const ids = messageIds(messages);
  // The bottom message, beside the input, until another is focused or after that one is deleted.
  const tabStop =
    focusedId !== undefined && ids.includes(focusedId) ? focusedId : ids.at(-1);

  const trackFocus = (event: FocusEvent<HTMLDivElement>) => {
    setFocusedId(
      event.target.closest<HTMLElement>(".chat-message")?.dataset["id"],
    );
  };

  // Only from the message itself, so keys inside the reaction picker stay its own.
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    // Leaves shortcuts like Cmd+ArrowDown (scroll to the end) to the browser.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const messages = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(".chat-message"),
    ];
    const current = messages.findIndex((message) => message === event.target);
    if (current === -1) return;
    const target = focusTarget(messages, current, event.key);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <div className="chat-history">
      {/* Only catches what bubbles up from the messages, as jsx-a11y suggests. */}
      <div
        className="scrollable"
        role="presentation"
        onFocus={trackFocus}
        onKeyDown={navigate}
      >
        <ul className="content">
          <ChatHistoryMessages
            messages={messages}
            tabStop={tabStop}
            replyToId={replyToId}
            setReplyToId={setReplyToId}
          />
        </ul>
      </div>
    </div>
  );
};
