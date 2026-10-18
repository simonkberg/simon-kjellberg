"use client";

import {
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  type EmojiShortcodes,
  REACTION_EMOJI,
  searchEmoji,
  withSkinTone,
} from "@/lib/emoji";

import { arrowIndex, gridColumns } from "./arrowFocus";
import { ChatEmojiSuggestions } from "./ChatEmojiSuggestions";
import { loadShortcodes, reloadShortcodes } from "./shortcodes";
import { useSkinTone } from "./skinTone";

const LIMIT = 24;

const SHORTCODE = /(?:^|\s):([\w+-]*)$/;

/** The shortcode typed up to the caret, without its colon, and where it starts with its colon. */
function typedShortcode(input: HTMLInputElement) {
  const caret = input.selectionStart;
  if (caret === null || caret !== input.selectionEnd) return null;
  const query = SHORTCODE.exec(input.value.slice(0, caret))?.[1];
  return query === undefined
    ? null
    : { query, start: caret - query.length - 1, end: caret };
}

// A short query may be an emoticon like ":D", so Enter only picks once one is chosen.
const initialActive = (query: string) => (query.length >= 2 ? 0 : null);

/** A text input that suggests emoji for the shortcode typed up to its caret. */
export const ChatEmojiInput = ({
  ref,
  value,
  onValueChange,
  ...props
}: Omit<
  ComponentProps<"input">,
  "ref" | "value" | "onChange" | "onSelect" | "onKeyDown" | "onBlur" | "onFocus"
> & {
  ref: RefObject<HTMLInputElement | null>;
  value: string;
  onValueChange: (value: string) => void;
}) => {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [emoji, setEmoji] = useState<EmojiShortcodes[] | null>(null);
  // Tagged with the value it was typed in, so a reset by the form forgets it.
  const [typed, setTyped] = useState<{
    query: string;
    value: string;
    dismissed: boolean;
  } | null>(null);
  if (typed && typed.value !== value) setTyped(null);
  const query = typed && !typed.dismissed ? typed.query : null;

  const [active, setActive] = useState<number | null>(null);
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setActive(query === null ? null : initialActive(query));
  }

  const { modifier } = useSkinTone();
  const matches = (
    query === null || !emoji
      ? []
      : query
        ? searchEmoji(emoji, query, LIMIT)
        : REACTION_EMOJI
  ).map(({ emoji, name }) => ({ emoji: withSkinTone(emoji, modifier), name }));
  const open = matches.length > 0;
  const chosen = active === null ? undefined : matches[active];

  useEffect(() => {
    const input = ref.current;
    if (open && input) list.current?.showPopover({ source: input });
  }, [open, ref]);

  // A dismissal holds only for the shortcode it closed on.
  function track(input: HTMLInputElement) {
    const next = typedShortcode(input)?.query;
    const current = input.value;
    // Focus can come before hydration, leaving onFocus unheard.
    if (next !== undefined && !emoji) void loadShortcodes().then(setEmoji);
    setTyped((previous) => {
      if (next === undefined) return null;
      // Unchanged on a caret move, so React can skip the render.
      if (previous?.query === next && previous.value === current)
        return previous;
      return { query: next, value: current, dismissed: false };
    });
  }

  function dismiss() {
    setTyped((previous) => previous && { ...previous, dismissed: true });
  }

  function pick(glyph: string) {
    const input = ref.current;
    const shortcode = input && typedShortcode(input);
    if (!input || !shortcode) return;
    const spaced = /^\s/.test(input.value.slice(shortcode.end));
    input.setRangeText(
      spaced ? glyph : `${glyph} `,
      shortcode.start,
      shortcode.end,
      "end",
    );
    setTyped(null);
    onValueChange(input.value);
    input.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const listbox = list.current;
    if (!open || !listbox || event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
      return;
    }
    if (
      chosen &&
      (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))
    ) {
      event.preventDefault();
      pick(chosen.emoji);
      return;
    }
    // Home and End stay with the caret; until one is chosen, left and right do too.
    if (event.key === "Home" || event.key === "End") return;
    if (active === null) {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      setActive(0);
      return;
    }
    const buttons = [...listbox.querySelectorAll("button")];
    const next = arrowIndex(
      event,
      active,
      matches.length - 1,
      gridColumns(buttons),
    );
    if (next === undefined) return;
    event.preventDefault();
    if (matches[next]) setActive(next);
  }

  return (
    <>
      <input
        {...props}
        ref={ref}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          track(event.target);
        }}
        onSelect={(event) => track(event.currentTarget)}
        onFocus={() => void reloadShortcodes().then(setEmoji)}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          // Null when a tap on an emoji takes focus; its click picks it.
          if (
            open &&
            event.relatedTarget &&
            !list.current?.contains(event.relatedTarget)
          ) {
            dismiss();
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={chosen ? `${id}-${active}` : undefined}
      />
      {open && (
        <ChatEmojiSuggestions
          ref={list}
          id={id}
          matches={matches}
          active={active}
          onPick={pick}
          onDismiss={dismiss}
        />
      )}
    </>
  );
};
