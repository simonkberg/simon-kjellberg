"use client";

import { createContext, use, useId, useRef, useState } from "react";

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
      <button
        aria-label="Add reaction"
        title="Add reaction"
        className="react"
        popoverTarget={pickerId}
        disabled={reacting.has(messageId)}
      >
        {glyph}
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

function describeReactors({ count, users, mine }: Reaction): string {
  const named = mine ? ["You", ...users] : users;
  const onDiscord = count - named.length;
  return reactorList.format(
    onDiscord > 0 ? [...named, `${onDiscord} on Discord`] : named,
  );
}

const LONG_PRESS_MS = 500;

const ChatReactionPill = ({
  messageId,
  reaction,
}: {
  messageId: string;
  reaction: Reaction;
}) => {
  const { reacting, react } = use(ChatReactionsContext);
  const tipId = useId();
  const tip = useRef<HTMLSpanElement>(null);
  const press = useRef<{ timer?: number; held?: boolean }>({});

  const show = (source: HTMLElement) => tip.current?.showPopover({ source });
  const hide = () => tip.current?.hidePopover();
  // Hover and keyboard focus share the tooltip, and Safari blurs a clicked pill as it disables.
  const release = (button: HTMLElement) => {
    if (!button.matches(":hover, :focus-visible")) hide();
  };

  return (
    <>
      <button
        aria-pressed={reaction.mine === true}
        aria-describedby={tipId}
        disabled={reacting.has(messageId)}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") show(event.currentTarget);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") release(event.currentTarget);
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) {
            show(event.currentTarget);
          }
        }}
        onBlur={(event) => release(event.currentTarget)}
        onKeyDown={(event) => {
          press.current.held = false;
          if (event.key === "Escape") hide();
        }}
        // Touch has no hover, so a long press shows who reacted instead of toggling.
        onPointerDown={(event) => {
          press.current.held = false;
          if (event.pointerType !== "touch") return;
          const button = event.currentTarget;
          press.current.timer = window.setTimeout(() => {
            press.current.held = true;
            show(button);
            document.addEventListener("pointerdown", hide, {
              capture: true,
              once: true,
            });
          }, LONG_PRESS_MS);
        }}
        onPointerUp={() => clearTimeout(press.current.timer)}
        onPointerCancel={() => clearTimeout(press.current.timer)}
        onClick={(event) => {
          if (press.current.held) {
            press.current.held = false;
            return;
          }
          react(messageId, reaction.emoji);
          // Chrome moves focus off the pill this disables without a blur.
          if (event.detail === 0) hide();
        }}
      >
        {reaction.emoji} <span className="count">{reaction.count}</span>
      </button>
      <span
        ref={tip}
        id={tipId}
        // Not hint, whose light dismiss closes it on the click or tap that reveals it.
        popover="manual"
        role="tooltip"
        className="chat-reaction-tip"
      >
        {describeReactors(reaction)}
      </span>
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
