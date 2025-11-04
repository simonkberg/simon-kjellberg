import rawEmojiData from "emoji-datasource";

import { codePointsToString } from "./codePointsToString";

type RawEmoji = (typeof rawEmojiData)[0];

export type EmojiSkin = { name: string; string: string };
export type Emoji = {
  name: string;
  string: string;
  skins: Map<string, EmojiSkin> | null;
};

const emojiData = rawEmojiData.reduce(
  (acc, emoji) => {
    // Assign all aliases for this emoji
    for (const alias of emoji.short_names) {
      acc.alias.set(alias, emoji.short_name);
    }

    acc.data.set(emoji.short_name, emoji);

    return acc;
  },
  {
    data: new Map<string, RawEmoji>(),
    alias: new Map<string, string>(),
  },
);

const parseEmoji = (data: RawEmoji) => {
  const name = data.unified.toLowerCase();

  return {
    name,
    string: codePointsToString(name),
    skins:
      data.skin_variations != null
        ? new Map(
            Object.entries(data.skin_variations).map(([key, skin]) => {
              const skinName = skin.unified.toLowerCase();
              return [
                key.toLowerCase(),
                {
                  name: skinName,
                  string: codePointsToString(skinName),
                },
              ];
            }),
          )
        : null,
  };
};

export const getEmoji = (name: string): Emoji | null => {
  const key = emojiData.alias.get(name.toLowerCase());
  if (!key) return null;

  const data = emojiData.data.get(key);
  return data ? parseEmoji(data) : null;
};

export const keys = Array.from(emojiData.alias.keys());
