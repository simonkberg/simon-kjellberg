import "server-only";
import emoji from "emojibase-data/en/compact.json";
import emojibase from "emojibase-data/en/shortcodes/emojibase.json";
import joypixels from "emojibase-data/en/shortcodes/joypixels.json";

import { type EmojiShortcodes, qualified } from "@/lib/emoji";

const COMPONENT_GROUP = 2;
const FLAGS_GROUP = 9;
const COUNTRY_CODE = /^[a-z]{2}$/;

const codes = (preset: string | string[] | undefined) => [preset ?? []].flat();

const JOYPIXELS = new Set(Object.values(joypixels).flatMap(codes));

// JoyPixels' names first, the closest to Discord's; Emojibase's fill the gaps,
// leaving out names JoyPixels gives another emoji, so each name has one.
export const SHORTCODES: EmojiShortcodes[] = emoji.flatMap(
  ({ group, hexcode, unicode }) => {
    if (group === undefined || group === COMPONENT_GROUP) return [];
    const names = [
      ...codes(joypixels[hexcode]),
      ...codes(emojibase[hexcode]).filter((name) => !JOYPIXELS.has(name)),
    ].filter(
      // As exact matches, they would lead every two-letter search; flag_sk still finds 🇸🇰.
      (name) => group !== FLAGS_GROUP || !COUNTRY_CODE.test(name),
    );
    return [[qualified(unicode), ...names]];
  },
);

const EMOJI_BY_NAME = new Map(
  SHORTCODES.flatMap(([emoji, ...names]) =>
    names.map((name) => [name, emoji] as const),
  ),
);

// Code spans, escapes, URLs and Discord's own <tokens>, like <:emoji:id> and <t:time:R>, pass through whole.
// A code span takes its whole backtick run, so an unclosed one can't backtrack into every shorter run.
const SHORTCODE =
  /(?<!`)(?=(`+))\1[\s\S]*?[^`]\1(?!`)|\\.|https?:\/\/\S+|<[^\s>]+>|:([\w+-]+):/g;

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
