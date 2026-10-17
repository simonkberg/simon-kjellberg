"use client";

import {
  createContext,
  type KeyboardEvent,
  type ToggleEvent,
  use,
  useId,
  useRef,
  useState,
} from "react";

import { TooltipButton } from "@/components/Tooltip";
import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";

import { arrowFocus, gridColumns } from "./arrowFocus";
import { EmojiButton } from "./EmojiButton";

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
  const trigger = useRef<HTMLButtonElement>(null);

  const toggle = (event: ToggleEvent<HTMLDivElement>) => {
    setOpen(event.newState === "open");
    // The emoji unmount as it closes, which would otherwise leave focus on the page.
    if (
      event.newState !== "closed" ||
      !event.currentTarget.contains(document.activeElement)
    ) {
      return;
    }
    const button = trigger.current;
    // A pick disables the button before the picker closes.
    (button?.disabled
      ? button.closest<HTMLElement>(".chat-message")
      : button
    )?.focus();
  };

  const focusFirst = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState === "open") {
      event.currentTarget.querySelector("button")?.focus();
    }
  };

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    const picker = event.currentTarget;
    if (event.key === "Tab") {
      // Closing moves focus to the button, so Tab moves on past it and Shift+Tab lands on it.
      picker.hidePopover();
      if (event.shiftKey) event.preventDefault();
      return;
    }
    const buttons = [...picker.querySelectorAll("button")];
    // Also at its edges, where the key would scroll the chat behind the picker.
    if (arrowFocus(event, buttons, gridColumns(buttons)))
      event.preventDefault();
  };

  return (
    <>
      <TooltipButton
        ref={trigger}
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
        role="toolbar"
        aria-label="Pick a reaction"
        tabIndex={-1}
        className="chat-reaction-picker emoji-picker"
        onBeforeToggle={toggle}
        onToggle={focusFirst}
        onKeyDown={navigate}
      >
        {open &&
          REACTION_EMOJI.map(({ emoji, name }) => (
            <EmojiButton
              key={name}
              emoji={emoji}
              name={name}
              picker={pickerId}
              popoverTarget={pickerId}
              popoverTargetAction="hide"
              onClick={() => react(messageId, emoji)}
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
