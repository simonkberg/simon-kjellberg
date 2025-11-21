import { expect, test } from "vitest";

import * as emojiData from "./emojiData";
import { emojiParser } from "./emojiParser";

const skinMap: Record<string, string> = {
  "1f3fb": "skin-tone-2",
  "1f3fc": "skin-tone-3",
  "1f3fd": "skin-tone-4",
  "1f3fe": "skin-tone-5",
  "1f3ff": "skin-tone-6",
  "1f3fb-1f3fb": "skin-tone-2-2",
  "1f3fb-1f3fc": "skin-tone-2-3",
  "1f3fb-1f3fd": "skin-tone-2-4",
  "1f3fb-1f3fe": "skin-tone-2-5",
  "1f3fb-1f3ff": "skin-tone-2-6",
  "1f3fc-1f3fb": "skin-tone-3-2",
  "1f3fc-1f3fc": "skin-tone-3-3",
  "1f3fc-1f3fd": "skin-tone-3-4",
  "1f3fc-1f3fe": "skin-tone-3-5",
  "1f3fc-1f3ff": "skin-tone-3-6",
  "1f3fd-1f3fb": "skin-tone-4-2",
  "1f3fd-1f3fc": "skin-tone-4-3",
  "1f3fd-1f3fd": "skin-tone-4-4",
  "1f3fd-1f3fe": "skin-tone-4-5",
  "1f3fd-1f3ff": "skin-tone-4-6",
  "1f3fe-1f3fb": "skin-tone-5-2",
  "1f3fe-1f3fc": "skin-tone-5-3",
  "1f3fe-1f3fd": "skin-tone-5-4",
  "1f3fe-1f3fe": "skin-tone-5-5",
  "1f3fe-1f3ff": "skin-tone-5-6",
  "1f3ff-1f3fb": "skin-tone-6-2",
  "1f3ff-1f3fc": "skin-tone-6-3",
  "1f3ff-1f3fd": "skin-tone-6-4",
  "1f3ff-1f3fe": "skin-tone-6-5",
  "1f3ff-1f3ff": "skin-tone-6-6",
};

test("emojiParser", () => {
  const string = emojiData.keys
    .map((key) => [key, emojiData.getEmoji(key)!] as const)
    .reduce((acc, [name, emoji]): string => {
      const emote = `:${name}:`;
      const result = `${acc}${emote} = ${emojiParser(emote)}\n`;

      return emoji.skins != null
        ? Array.from(emoji.skins.keys()).reduce((innerAcc, key) => {
            const emoteWithSkin = `${emote}:${skinMap[key]}:`;
            return `${innerAcc}${emoteWithSkin} = ${emojiParser(emoteWithSkin)}\n`;
          }, result)
        : result;
    }, "");

  expect(string).toMatchSnapshot();
});
