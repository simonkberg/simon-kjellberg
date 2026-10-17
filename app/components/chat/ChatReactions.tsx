"use client";

import { createContext, use, useId, useState } from "react";

import { TooltipButton } from "@/components/Tooltip";
import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";

export interface ChatReactionsContextValue {
  reacting: ReadonlySet<string>;
  react: (messageId: string, emoji: string) => void;
}

export const ChatReactionsContext = createContext<ChatReactionsContextValue>({
  reacting: new Set(),
  react: () => {},
});

export const ChatReactionPicker = ({
  messageId,
  glyph = "☺",
}: {
  messageId: string;
  glyph?: string;
}) => {
  const { reacting, react } = use(ChatReactionsContext);
  const pickerId = useId();
  // Rendered only while open: a hundred messages would otherwise hold thousands of buttons.
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipButton
        tooltip="Add reaction"
        className="react"
        popoverTarget={pickerId}
        disabled={reacting.has(messageId)}
      >
        {glyph}
      </TooltipButton>
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
            <TooltipButton
              key={name}
              tooltip={`:${name}:`}
              // Above the whole picker, so the name never covers the emoji around it.
              anchor={pickerId}
              aria-label={name}
              popoverTarget={pickerId}
              popoverTargetAction="hide"
              onClick={() => react(messageId, emoji)}
            >
              {emoji}
            </TooltipButton>
          ))}
      </div>
    </>
  );
};

const reactorList = new Intl.ListFormat("en", { type: "conjunction" });

function describeReactors({ count, users, mine }: Reaction): string {
  const named = mine ? ["You", ...users] : users;
  const onDiscord = count - named.length;
  return reactorList.format(
    onDiscord > 0 ? [...named, `${onDiscord} on Discord`] : named,
  );
}

export const ChatReactionList = ({
  messageId,
  reactions,
}: {
  messageId: string;
  reactions: Reaction[];
}) => {
  const { reacting, react } = use(ChatReactionsContext);

  return (
    <div className="reactions" role="group" aria-label="Reactions">
      {reactions.map((reaction) => (
        <TooltipButton
          key={reaction.emoji}
          tooltip={describeReactors(reaction)}
          describes
          aria-pressed={reaction.mine === true}
          disabled={reacting.has(messageId)}
          onClick={() => react(messageId, reaction.emoji)}
        >
          {reaction.emoji} <span className="count">{reaction.count}</span>
        </TooltipButton>
      ))}
      <ChatReactionPicker messageId={messageId} glyph="+" />
    </div>
  );
};
