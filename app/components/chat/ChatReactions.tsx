"use client";

import { createContext, use, useId, useState } from "react";

import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";

export interface ChatReactionsContextValue {
  username: string;
  reacting: ReadonlySet<string>;
  react: (messageId: string, emoji: string) => void;
}

export const ChatReactionsContext = createContext<ChatReactionsContextValue>({
  username: "",
  reacting: new Set(),
  react: () => {},
});

export const ChatReactionPicker = ({ messageId }: { messageId: string }) => {
  const { reacting, react } = use(ChatReactionsContext);
  const pickerId = useId();
  // Rendered only while open: a hundred messages would otherwise hold thousands of buttons.
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Add reaction"
        title="Add reaction"
        className="react"
        popoverTarget={pickerId}
        disabled={reacting.has(messageId)}
      >
        ☺
      </button>
      <div
        id={pickerId}
        popover="auto"
        role="group"
        aria-label="Pick a reaction"
        className="chat-reaction-picker"
        onBeforeToggle={(event) => setOpen(event.newState === "open")}
      >
        {open &&
          REACTION_EMOJI.map(({ emoji, name }) => (
            <button
              key={name}
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

const reactorList = new Intl.ListFormat("en", { type: "conjunction" });

function describeReactors({ count, users }: Reaction): string {
  const onDiscord = count - users.length;
  return reactorList.format(
    onDiscord > 0 ? [...users, `${onDiscord} on Discord`] : users,
  );
}

export const ChatReactionList = ({
  messageId,
  reactions,
}: {
  messageId: string;
  reactions: Reaction[];
}) => {
  const { username, reacting, react } = use(ChatReactionsContext);

  return (
    <div className="reactions" role="group" aria-label="Reactions">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          aria-pressed={reaction.users.includes(username)}
          title={describeReactors(reaction)}
          disabled={reacting.has(messageId)}
          onClick={() => react(messageId, reaction.emoji)}
        >
          {reaction.emoji} <span className="count">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
