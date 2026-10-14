"use client";

import { createContext, use, useId } from "react";

import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";

export interface ChatReactionsContextValue {
  username: string | null;
  pending: boolean;
  react: (messageId: string, emoji: string) => void;
}

export const ChatReactionsContext = createContext<ChatReactionsContextValue>({
  username: null,
  pending: false,
  react: () => {},
});

export const ChatReactionPicker = ({ messageId }: { messageId: string }) => {
  const { pending, react } = use(ChatReactionsContext);
  const pickerId = useId();

  return (
    <>
      <button
        aria-label="Add reaction"
        title="Add reaction"
        className="react"
        popoverTarget={pickerId}
        disabled={pending}
      >
        ☺
      </button>
      <div
        id={pickerId}
        popover="auto"
        role="menu"
        aria-label="Reactions"
        className="chat-reaction-picker"
      >
        {REACTION_EMOJI.map(({ emoji, name }) => (
          <button
            key={name}
            role="menuitem"
            aria-label={name}
            title={`:${name}:`}
            popoverTarget={pickerId}
            popoverTargetAction="hide"
            onClick={() => react(messageId, emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};

function describeReactors({ count, users }: Reaction): string {
  const onDiscord = count - users.length;
  const names = onDiscord > 0 ? [...users, `${onDiscord} on Discord`] : users;
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : (names[0] ?? "");
}

export const ChatReactionList = ({
  messageId,
  reactions,
}: {
  messageId: string;
  reactions: Reaction[];
}) => {
  const { username, pending, react } = use(ChatReactionsContext);

  return (
    <div className="reactions" role="group" aria-label="Reactions">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          aria-pressed={username !== null && reaction.users.includes(username)}
          title={describeReactors(reaction)}
          disabled={pending}
          onClick={() => react(messageId, reaction.emoji)}
        >
          {reaction.emoji} <span className="count">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
