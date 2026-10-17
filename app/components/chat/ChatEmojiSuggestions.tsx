"use client";

import type { Ref, ToggleEvent } from "react";

import type { EmojiMatch } from "@/lib/emoji";

import { EmojiButton } from "./EmojiButton";

export const ChatEmojiSuggestions = ({
  ref,
  id,
  matches,
  active,
  onPick,
  onDismiss,
}: {
  ref: Ref<HTMLDivElement>;
  id: string;
  matches: readonly EmojiMatch[];
  active: number | null;
  onPick: (emoji: string) => void;
  onDismiss: () => void;
}) => {
  const chosen = active === null ? undefined : matches[active];
  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      role="listbox"
      aria-label="Emoji"
      tabIndex={-1}
      className="emoji-picker"
      // Keeps focus in the input, so typing carries on filtering.
      onMouseDown={(event) => event.preventDefault()}
      onToggle={(event: ToggleEvent<HTMLDivElement>) => {
        if (event.newState === "closed") onDismiss();
      }}
    >
      {matches.map(({ emoji, name }, index) => (
        <EmojiButton
          key={emoji}
          id={`${id}-${index}`}
          emoji={emoji}
          name={name}
          picker={id}
          type="button"
          role="option"
          aria-selected={index === active}
          tabIndex={-1}
          onClick={() => onPick(emoji)}
        />
      ))}
      <p className="name" aria-hidden="true">
        {chosen && `:${chosen.name}:`}
      </p>
    </div>
  );
};
