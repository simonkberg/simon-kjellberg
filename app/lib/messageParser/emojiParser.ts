import * as emojiData from "./emojiData";

const regexKeys = emojiData.keys.join("|").replace(/[+]/g, "\\$&");
const regex = new RegExp(
  `:(${regexKeys})(?:::)?(skin-tone-[2-6](?:-[2-6])?)?:`,
  "gim",
);

const getEmoji = (emojiKey: string, skinKey?: string) => {
  const emoji = emojiData.getEmoji(emojiKey.toLowerCase());

  if (emoji != null && skinKey != null && emoji.skins != null) {
    // Check if it's a combined skin tone (e.g., skin-tone-2-3)
    const combinedMatch = skinKey.match(/^skin-tone-(\d)-(\d)$/);

    if (combinedMatch) {
      // For combined tones, resolve each part separately
      const [, tone1Num, tone2Num] = combinedMatch;
      const skin1 = emojiData.getEmoji(`skin-tone-${tone1Num}`);
      const skin2 = emojiData.getEmoji(`skin-tone-${tone2Num}`);

      if (skin1 != null && skin2 != null) {
        const hexKey = `${skin1.name}-${skin2.name}`;
        if (emoji.skins.has(hexKey)) {
          return emoji.skins.get(hexKey);
        }
      }
    } else {
      // Single skin tone (e.g., skin-tone-2)
      const skin = emojiData.getEmoji(skinKey.toLowerCase());

      if (skin != null && emoji.skins.has(skin.name)) {
        return emoji.skins.get(skin.name);
      }
    }
  }

  return emoji;
};

const replacer = (match: string, emojiKey: string, skinKey?: string) => {
  const emoji = getEmoji(emojiKey, skinKey);

  if (emoji != null) {
    return emoji.string;
  }

  return match;
};

export const emojiParser = (string: string) => string.replace(regex, replacer);
