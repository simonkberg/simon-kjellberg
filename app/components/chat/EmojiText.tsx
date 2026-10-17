"use client";

import { Suspense, use } from "react";

import { TooltipText } from "@/components/Tooltip";
import { qualified } from "@/lib/emoji";

import { loadShortcodes } from "./ChatEmojiSuggestions";

const EMOJI = /(\p{RGI_Emoji})/v;

// The set names each emoji without skin tones; a tone stands where a text-style base takes U+FE0F.
const baseEmoji = (emoji: string) =>
  qualified(emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "\uFE0F"));

const Shortcode = ({ emoji }: { emoji: string }) => {
  const base = baseEmoji(emoji);
  const name = use(loadShortcodes()).find(([known]) => known === base)?.[1];
  return name && `:${name}:`;
};

/** Text with each emoji naming its shortcode in a tooltip. */
export const EmojiText = ({ text }: { text: string }) =>
  text.split(EMOJI).map((part, index) =>
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
