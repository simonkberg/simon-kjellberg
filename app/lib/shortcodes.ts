import "server-only";
import emoji from "emojibase-data/en/compact.json";
import emojibase from "emojibase-data/en/shortcodes/emojibase.json";
import joypixels from "emojibase-data/en/shortcodes/joypixels.json";

import { type EmojiShortcodes, qualified } from "@/lib/emoji";

const COMPONENT_GROUP = 2;
const FLAGS_GROUP = 9;
const COUNTRY_CODE = /^[a-z]{2}$/;

const codes = (preset: string | string[] | undefined) => [preset ?? []].flat();

const EMOJI = emoji.flatMap(({ group, hexcode, unicode }) => {
  if (group === undefined || group === COMPONENT_GROUP) return [];
  // As exact matches, they would lead every two-letter search; flag_sk still finds 🇸🇰.
  const names = (preset: string | string[] | undefined) =>
    codes(preset).filter(
      (name) => group !== FLAGS_GROUP || !COUNTRY_CODE.test(name),
    );
  return [
    {
      emoji: qualified(unicode),
      joypixels: names(joypixels[hexcode]),
      emojibase: names(emojibase[hexcode]),
    },
  ];
});

// JoyPixels' names first, the closest to Discord's; Emojibase's fill the gaps.
export const SHORTCODES: EmojiShortcodes[] = EMOJI.map(
  ({ emoji, joypixels, emojibase }) => [
    emoji,
    ...new Set([...joypixels, ...emojibase]),
  ],
);

// A name on two emoji, like dog on 🐶 and 🐕, goes to the one JoyPixels gives it.
const EMOJI_BY_NAME = new Map(
  [
    ...EMOJI.map(({ emoji, emojibase }) => [emoji, emojibase] as const),
    ...EMOJI.map(({ emoji, joypixels }) => [emoji, joypixels] as const),
  ].flatMap(([emoji, names]) => names.map((name) => [name, emoji] as const)),
);

// Code spans, escapes, URLs and Discord's own <:emoji:id> tokens pass through whole.
const SHORTCODE =
  /(`+)[\s\S]*?[^`]\1(?!`)|\\.|https?:\/\/\S+|<a?:\w+:\d+>|:([\w+-]+):/g;

/** Replaces each known `:shortcode:` with its emoji, outside code, as Discord does. */
export function emojify(text: string): string {
  const pattern = new RegExp(SHORTCODE);
  let result = "";
  let last = 0;
  for (let match; (match = pattern.exec(text));) {
    const name = match[2];
    if (name === undefined) continue;
    const emoji = EMOJI_BY_NAME.get(name);
    if (emoji === undefined) {
      // Its closing colon may open the next one, as in :a::smile:.
      pattern.lastIndex--;
    } else {
      result += text.slice(last, match.index) + emoji;
      last = pattern.lastIndex;
    }
  }
  return result + text.slice(last);
}
