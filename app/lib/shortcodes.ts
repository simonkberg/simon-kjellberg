import "server-only";
import emoji from "emojibase-data/en/compact.json";
import emojibase from "emojibase-data/en/shortcodes/emojibase.json";
import joypixels from "emojibase-data/en/shortcodes/joypixels.json";

import { type EmojiShortcodes, qualified } from "@/lib/emoji";

const COMPONENT_GROUP = 2;
const FLAGS_GROUP = 9;
const COUNTRY_CODE = /^[a-z]{2}$/;

const EMOJI = emoji.flatMap(({ group, hexcode, unicode }) => {
  if (group === undefined || group === COMPONENT_GROUP) return [];
  // As exact matches, they would lead every two-letter search; flag_sk still finds 🇸🇰.
  const names = (preset: string | string[] | undefined) =>
    [preset ?? []]
      .flat()
      .filter((name) => group !== FLAGS_GROUP || !COUNTRY_CODE.test(name));
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

const byName = (preset: "joypixels" | "emojibase") =>
  EMOJI.flatMap((e) => e[preset].map((name) => [name, e.emoji] as const));

// A name on two emoji, like dog on 🐶 and 🐕, goes to the one JoyPixels gives it.
const EMOJI_BY_NAME = new Map([...byName("emojibase"), ...byName("joypixels")]);

// Code spans, escapes, URLs and Discord's own <tokens>, like <:emoji:id> and <t:time:R>, pass through whole.
const SHORTCODE =
  /(`+)[\s\S]*?[^`]\1(?!`)|\\.|https?:\/\/\S+|<[^\s>]+>|:([\w+-]+):/g;

/** Replaces each known `:shortcode:` with its emoji, outside code, as Discord does. */
export function emojify(text: string): string {
  if (!text.includes(":")) return text;
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
