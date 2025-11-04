import * as emojiData from "./emojiData";

const regexKeys = emojiData.keys.join("|").replace(/[+]/g, "\\$&");
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, "gim");

const getEmoji = (emojiKey: string, skinKey?: string) => {
  const emoji = emojiData.getEmoji(emojiKey.toLowerCase());

  if (emoji != null && skinKey != null && emoji.skins != null) {
    const skin = emojiData.getEmoji(skinKey.toLowerCase());

    if (skin != null && emoji.skins.has(skin.name)) {
      return emoji.skins.get(skin.name);
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
