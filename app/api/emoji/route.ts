import emoji from "emojibase-data/en/compact.json";
import emojibase from "emojibase-data/en/shortcodes/emojibase.json";
import joypixels from "emojibase-data/en/shortcodes/joypixels.json";

import type { EmojiShortcodes } from "@/lib/emoji";

const COMPONENT_GROUP = 2;
const FLAGS_GROUP = 9;
const COUNTRY_CODE = /^[a-z]{2}$/;

const codes = (preset: string | string[] | undefined) => [preset ?? []].flat();

// Emojibase adds U+FE0F to emoji like 👍 that have a text style but already default to emoji.
const qualified = (emoji: string) =>
  emoji.replace(/(\p{Emoji_Presentation})\uFE0F/gu, "$1");

// JoyPixels' names first, the closest to Discord's; Emojibase's fill the gaps.
const SHORTCODES: EmojiShortcodes[] = emoji.flatMap(
  ({ group, hexcode, unicode }) => {
    if (group === undefined || group === COMPONENT_GROUP) return [];
    const names = new Set(
      [...codes(joypixels[hexcode]), ...codes(emojibase[hexcode])].filter(
        // As exact matches, they would lead every two-letter search; flag_sk still finds 🇸🇰.
        (name) => group !== FLAGS_GROUP || !COUNTRY_CODE.test(name),
      ),
    );
    return names.size ? [[qualified(unicode), ...names]] : [];
  },
);

export function GET() {
  return Response.json(SHORTCODES);
}
