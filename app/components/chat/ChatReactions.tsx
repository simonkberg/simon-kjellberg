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

export interface ChatReactionsContextValue {
  reacting: ReadonlySet<string>;
  react: (messageId: string, emoji: string) => void;
}

export const ChatReactionsContext = createContext<ChatReactionsContextValue>({
  reacting: new Set(),
  react: () => {},
});

function pickerIndex(
  buttons: HTMLElement[],
  current: number,
  key: string,
): number | undefined {
  const top = buttons[0]?.offsetTop;
  const wrap = buttons.findIndex((button) => button.offsetTop !== top);
  const columns = wrap === -1 ? buttons.length : wrap;
  switch (key) {
    case "ArrowLeft":
      return current - 1;
    case "ArrowRight":
      return current + 1;
    case "ArrowUp":
      return current - columns;
    case "ArrowDown":
      return current + columns;
    case "Home":
      return 0;
    case "End":
      return buttons.length - 1;
    default:
      return undefined;
  }
}

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
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const buttons = [...picker.querySelectorAll("button")];
    const current = buttons.findIndex((button) => button === event.target);
    const index = pickerIndex(buttons, current, event.key);
    if (index === undefined) return;
    // Even at an edge, so the arrow doesn't scroll the chat behind the picker.
    event.preventDefault();
    buttons[index]?.focus();
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
        className="chat-reaction-picker"
        onBeforeToggle={toggle}
        onToggle={focusFirst}
        onKeyDown={navigate}
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
