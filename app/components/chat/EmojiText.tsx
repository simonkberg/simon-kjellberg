"use client";

import { Suspense, use } from "react";

import { TooltipText } from "@/components/Tooltip";

import { loadShortcodes } from "./ChatEmojiSuggestions";

// Built at runtime: a `v` literal fails to parse before Safari 17, taking the chat with it.
const EMOJI =
  "unicodeSets" in RegExp.prototype
    ? new RegExp("(\\p{RGI_Emoji})", "v")
    : undefined;

// The set names each emoji without skin tones, and without U+FE0F where it defaults to emoji anyway.
const baseEmoji = (emoji: string) =>
  emoji
    .replace(/(\p{Emoji_Presentation})?[\u{1F3FB}-\u{1F3FF}]/gu, (_, base) =>
      base === undefined ? "\uFE0F" : base,
    )
    .replace(/(\p{Emoji_Presentation})\uFE0F/gu, "$1");

const Shortcode = ({ emoji }: { emoji: string }) => {
  const base = baseEmoji(emoji);
  const name = use(loadShortcodes()).find(([known]) => known === base)?.[1];
  return name && `:${name}:`;
};

/** Text with each emoji naming its shortcode in a tooltip. */
export const EmojiText = ({ text }: { text: string }) =>
  EMOJI === undefined
    ? text
    : text.split(EMOJI).map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : (
          <TooltipText
            key={index}
            tooltip={
              <Suspense fallback="…">
                <Shortcode emoji={part} />
              </Suspense>
            }
          >
            {part}
          </TooltipText>
        ),
      );
