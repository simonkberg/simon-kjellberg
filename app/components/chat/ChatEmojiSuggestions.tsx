"use client";

import {
  type RefObject,
  type ToggleEvent,
  use,
  useEffect,
  useRef,
  useState,
} from "react";

import { type EmojiShortcodes, REACTION_EMOJI, searchEmoji } from "@/lib/emoji";

import { arrowIndex, gridColumns } from "./arrowFocus";
import { EmojiButton } from "./EmojiButton";

const LIMIT = 24;

const REACTION_SHORTCODES: EmojiShortcodes[] = REACTION_EMOJI.map(
  ({ emoji, name }) => [emoji, name],
);

let shortcodes: Promise<EmojiShortcodes[]> | undefined;

// Fetched on the first shortcode, so the full set never ships with the page.
function loadShortcodes(): Promise<EmojiShortcodes[]> {
  shortcodes ??= fetch("/api/emoji")
    .then((response) => response.json() as Promise<EmojiShortcodes[]>)
    .catch(() => REACTION_SHORTCODES);
  return shortcodes;
}

// A short query may be an emoticon like ":D", so Enter only picks once one is chosen.
const initialActive = (query: string) => (query.length >= 2 ? 0 : null);

export const ChatEmojiSuggestions = ({
  id,
  input,
  query,
  onPick,
  onDismiss,
}: {
  id: string;
  input: RefObject<HTMLInputElement | null>;
  query: string;
  onPick: (emoji: string) => void;
  onDismiss: () => void;
}) => {
  const emoji = use(loadShortcodes());
  const picker = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialActive(query));
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setActive(initialActive(query));
  }

  const matches = query ? searchEmoji(emoji, query, LIMIT) : REACTION_EMOJI;
  const shown = matches.length > 0;

  useEffect(() => {
    if (shown)
      picker.current?.showPopover({ source: input.current ?? undefined });
  }, [shown, input]);

  useEffect(() => {
    const field = input.current;
    if (!field || !shown) return;
    if (active !== null) {
      field.setAttribute("aria-activedescendant", `${id}-${active}`);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }
      const match = active === null ? undefined : matches[active];
      if (
        match &&
        (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))
      ) {
        event.preventDefault();
        onPick(match.emoji);
        return;
      }
      // Until one is chosen, left and right still move the caret.
      if (active === null) {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        setActive(0);
        return;
      }
      const buttons = [...(picker.current?.querySelectorAll("button") ?? [])];
      const next = arrowIndex(
        event,
        active,
        matches.length - 1,
        gridColumns(buttons),
      );
      if (next === undefined) return;
      event.preventDefault();
      if (matches[next]) setActive(next);
    };
    // Null when a tap on an emoji takes focus; its click picks it.
    const onBlur = (event: FocusEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        !picker.current?.contains(event.relatedTarget)
      ) {
        onDismiss();
      }
    };

    field.addEventListener("keydown", onKeyDown);
    field.addEventListener("blur", onBlur);
    return () => {
      field.removeEventListener("keydown", onKeyDown);
      field.removeEventListener("blur", onBlur);
      field.removeAttribute("aria-activedescendant");
    };
  });

  if (!shown) return null;

  return (
    <div
      ref={picker}
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
    </div>
  );
};
