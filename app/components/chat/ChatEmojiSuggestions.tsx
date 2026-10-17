"use client";

import {
  type RefObject,
  type ToggleEvent,
  use,
  useEffect,
  useLayoutEffect,
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
let failed = false;

function loadShortcodes(): Promise<EmojiShortcodes[]> {
  shortcodes ??= fetch("/api/emoji", { signal: AbortSignal.timeout(10_000) })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<EmojiShortcodes[]>;
    })
    .catch(() => {
      failed = true;
      return REACTION_SHORTCODES;
    });
  return shortcodes;
}

/** Fetched once the input has focus, so the full set never ships with the page; a failure retries on the next focus. */
export function prefetchShortcodes() {
  if (failed) {
    failed = false;
    shortcodes = undefined;
  }
  void loadShortcodes();
}

/** What typing on would add to the query to spell the name, or the whole name when it doesn't start with it. */
function completes(name: string | undefined, query: string) {
  if (name === undefined) return null;
  const typed = query.toLowerCase();
  return name.startsWith(typed)
    ? `${name.slice(typed.length)}:`
    : ` → :${name}:`;
}

// A short query may be an emoticon like ":D", so Enter only picks once one is chosen.
const initialActive = (query: string) => (query.length >= 2 ? 0 : null);

export const ChatEmojiSuggestions = ({
  id,
  input,
  query,
  typed,
  onPick,
  onDismiss,
}: {
  id: string;
  input: RefObject<HTMLInputElement | null>;
  query: string;
  /** The input's text, when the shortcode ends it and a completion can follow. */
  typed: string | null;
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
  const completion = completes(
    active === null ? undefined : matches[active]?.name,
    query,
  );
  const overlay = useRef<HTMLSpanElement>(null);

  // aria-expanded is set here, since only this knows whether the list has loaded and has matches.
  useEffect(() => {
    const field = input.current;
    if (!shown || !field) return;
    picker.current?.showPopover({ source: field });
    field.setAttribute("aria-expanded", "true");
    return () => field.setAttribute("aria-expanded", "false");
  }, [shown, input]);

  useEffect(() => {
    const field = input.current;
    const list = picker.current;
    if (!field || !list) return;
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
      // Home and End stay with the caret; until one is chosen, left and right do too.
      if (event.key === "Home" || event.key === "End") return;
      if (active === null) {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        setActive(0);
        return;
      }
      const buttons = [...list.querySelectorAll("button")];
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
        !list.contains(event.relatedTarget)
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

  // Lies over the input, its typed text hidden, so the completion follows the caret.
  useLayoutEffect(() => {
    const field = input.current;
    const ghost = overlay.current;
    if (!field || !ghost) return;
    ghost.style.inset = `${field.offsetTop}px auto auto ${field.offsetLeft}px`;
    ghost.style.width = `${field.offsetWidth}px`;
    ghost.style.height = `${field.offsetHeight}px`;
    ghost.scrollLeft = field.scrollLeft;
  });

  if (!shown) return null;

  return (
    <>
      {typed !== null && completion && (
        <span ref={overlay} className="emoji-completion" aria-hidden="true">
          <span className="typed">{typed}</span>
          {completion}
        </span>
      )}
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
    </>
  );
};
