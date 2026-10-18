"use client";

import { Suspense, use } from "react";

import { TooltipText } from "@/components/Tooltip";
import { withoutSkinTone } from "@/lib/emoji";

import { loadShortcodes } from "./shortcodes";

const EMOJI = /(\p{RGI_Emoji})/v;

const Shortcode = ({ emoji }: { emoji: string }) => {
  const base = withoutSkinTone(emoji);
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
