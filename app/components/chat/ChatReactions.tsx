"use client";

import { createContext, use, useId, useState } from "react";

import { Tooltip, useTooltip } from "@/components/Tooltip";
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

const ChatReactionPickerEmoji = ({
  emoji,
  name,
  pickerId,
  onPick,
}: {
  emoji: string;
  name: string;
  pickerId: string;
  onPick: () => void;
}) => {
  // Above the whole picker, so the name never covers the emoji around it.
  const tooltip = useTooltip(() => document.getElementById(pickerId));

  return (
    <>
      <button
        aria-label={name}
        popoverTarget={pickerId}
        popoverTargetAction="hide"
        onClick={onPick}
        {...tooltip.trigger}
      >
        {emoji}
      </button>
      <Tooltip {...tooltip.tooltip}>:{name}:</Tooltip>
    </>
  );
};

export const ChatReactionPicker = ({
  messageId,
  glyph = "☺",
}: {
  messageId: string;
  glyph?: string;
}) => {
  const { reacting, react } = use(ChatReactionsContext);
  const pickerId = useId();
  const tooltip = useTooltip();
  // Rendered only while open: a hundred messages would otherwise hold thousands of buttons.
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-labelledby={tooltip.id}
        className="react"
        popoverTarget={pickerId}
        disabled={reacting.has(messageId)}
        {...tooltip.trigger}
      >
        {glyph}
      </button>
      <Tooltip {...tooltip.tooltip}>Add reaction</Tooltip>
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
            <ChatReactionPickerEmoji
              key={name}
              emoji={emoji}
              name={name}
              pickerId={pickerId}
              onPick={() => react(messageId, emoji)}
            />
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

const ChatReactionPill = ({
  messageId,
  reaction,
}: {
  messageId: string;
  reaction: Reaction;
}) => {
  const { reacting, react } = use(ChatReactionsContext);
  const tooltip = useTooltip();

  return (
    <>
      <button
        aria-pressed={reaction.mine === true}
        aria-describedby={tooltip.id}
        disabled={reacting.has(messageId)}
        onClick={() => react(messageId, reaction.emoji)}
        {...tooltip.trigger}
      >
        {reaction.emoji} <span className="count">{reaction.count}</span>
      </button>
      <Tooltip {...tooltip.tooltip}>{describeReactors(reaction)}</Tooltip>
    </>
  );
};

export const ChatReactionList = ({
  messageId,
  reactions,
}: {
  messageId: string;
  reactions: Reaction[];
}) => (
  <div className="reactions" role="group" aria-label="Reactions">
    {reactions.map((reaction) => (
      <ChatReactionPill
        key={reaction.emoji}
        messageId={messageId}
        reaction={reaction}
      />
    ))}
    <ChatReactionPicker messageId={messageId} glyph="+" />
  </div>
);
