import "server-only";
import emoji from "emojibase-data/en/compact.json";
import emojibase from "emojibase-data/en/shortcodes/emojibase.json";
import joypixels from "emojibase-data/en/shortcodes/joypixels.json";

import { type EmojiShortcodes, qualified } from "@/lib/emoji";

const COMPONENT_GROUP = 2;
const FLAGS_GROUP = 9;
const COUNTRY_CODE = /^[a-z]{2}$/;

const codes = (preset: string | string[] | undefined) => [preset ?? []].flat();

// JoyPixels' names first, the closest to Discord's; Emojibase's fill the gaps.
export const SHORTCODES: EmojiShortcodes[] = emoji.flatMap(
  ({ group, hexcode, unicode }) => {
    if (group === undefined || group === COMPONENT_GROUP) return [];
    const names = new Set(
      [...codes(joypixels[hexcode]), ...codes(emojibase[hexcode])].filter(
        // As exact matches, they would lead every two-letter search; flag_sk still finds 🇸🇰.
        (name) => group !== FLAGS_GROUP || !COUNTRY_CODE.test(name),
      ),
    );
    return [[qualified(unicode), ...names]];
  },
);

const EMOJI_BY_NAME = new Map(
  SHORTCODES.flatMap(([emoji, ...names]) =>
    names.map((name) => [name, emoji] as const),
  ),
);

// Code spans, escapes and URLs pass through whole, so only the shortcode group is ever replaced.
const SHORTCODE = /(`+)[\s\S]*?[^`]\1(?!`)|\\.|https?:\/\/\S+|:([\w+-]+):/g;

/** Replaces each known `:shortcode:` with its emoji, outside code, as Discord does. */
export const emojify = (text: string) =>
  text.replace(
    SHORTCODE,
    (match, _ticks, name?: string) =>
      (name !== undefined && EMOJI_BY_NAME.get(name)) || match,
  );
