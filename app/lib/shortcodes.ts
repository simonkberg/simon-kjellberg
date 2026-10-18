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

const TONE_MODIFIER = /1F3F[B-F]/g;

// Each emoji's five single-tone variants, light to dark, as :skin-tone-1: to :skin-tone-5: pick them.
const SKINS = new Map(
  emoji.flatMap(({ unicode, skins }) => {
    const tones = skins?.filter(
      ({ hexcode }) => hexcode.match(TONE_MODIFIER)?.length === 1,
    );
    return tones?.length === 5
      ? [[qualified(unicode), tones.map((skin) => qualified(skin.unicode))]]
      : [];
  }),
);

const SKIN_TONE = /:skin-tone-([1-5]):/y;

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
      SKIN_TONE.lastIndex = pattern.lastIndex;
      const tone = SKIN_TONE.exec(text)?.[1];
      const toned = tone && SKINS.get(emoji)?.[Number(tone) - 1];
      if (toned) pattern.lastIndex = SKIN_TONE.lastIndex;
      result += text.slice(last, match.index) + (toned || emoji);
      last = pattern.lastIndex;
    }
  }
  return result + text.slice(last);
}
