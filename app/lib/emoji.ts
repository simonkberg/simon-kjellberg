/** The picker's set, kept small since this module ships to every visitor's browser. */
export const REACTION_EMOJI = [
  { emoji: "👍", name: "thumbsup" },
  { emoji: "👎", name: "thumbsdown" },
  { emoji: "❤️", name: "heart" },
  { emoji: "🔥", name: "fire" },
  { emoji: "😂", name: "joy" },
  { emoji: "🤣", name: "rolling_on_the_floor_laughing" },
  { emoji: "😭", name: "sob" },
  { emoji: "💀", name: "skull" },
  { emoji: "👀", name: "eyes" },
  { emoji: "😮", name: "open_mouth" },
  { emoji: "🤯", name: "exploding_head" },
  { emoji: "😡", name: "rage" },
  { emoji: "😬", name: "grimacing" },
  { emoji: "😅", name: "sweat_smile" },
  { emoji: "🥲", name: "smiling_face_with_tear" },
  { emoji: "😮‍💨", name: "face_exhaling" },
  { emoji: "🙃", name: "upside_down" },
  { emoji: "🫠", name: "melting_face" },
  { emoji: "😏", name: "smirk" },
  { emoji: "🤔", name: "thinking" },
  { emoji: "🤓", name: "nerd" },
  { emoji: "😎", name: "sunglasses" },
  { emoji: "😍", name: "heart_eyes" },
  { emoji: "🤡", name: "clown" },
  { emoji: "👏", name: "clap" },
  { emoji: "🙌", name: "raised_hands" },
  { emoji: "🙏", name: "pray" },
  { emoji: "👋", name: "wave" },
  { emoji: "🤌", name: "pinched_fingers" },
  { emoji: "💅", name: "nail_care" },
  { emoji: "🫡", name: "saluting_face" },
  { emoji: "🗿", name: "moyai" },
  { emoji: "🎉", name: "tada" },
  { emoji: "✨", name: "sparkles" },
  { emoji: "💯", name: "100" },
  { emoji: "🚀", name: "rocket" },
  { emoji: "🐐", name: "goat" },
  { emoji: "🧢", name: "billed_cap" },
  { emoji: "🍿", name: "popcorn" },
  { emoji: "🤖", name: "robot" },
] as const;

/** Discord's tones, in the order :skin-tone-1: to :skin-tone-5: name them, after the default. */
export const SKIN_TONES = [
  { name: "Default", modifier: "" },
  { name: "Light", modifier: "\u{1F3FB}" },
  { name: "Medium-light", modifier: "\u{1F3FC}" },
  { name: "Medium", modifier: "\u{1F3FD}" },
  { name: "Medium-dark", modifier: "\u{1F3FE}" },
  { name: "Dark", modifier: "\u{1F3FF}" },
] as const;

export type SkinTone = (typeof SKIN_TONES)[number];

/** Exactly one emoji, as Unicode recommends it for general interchange. */
export const RGI_EMOJI = /^\p{RGI_Emoji}$/v;

/** An emoji in a tone, if it takes one. */
export function withSkinTone(emoji: string, modifier: string): string {
  if (!modifier) return emoji;
  const toned = emoji.replace(/^(.)\uFE0F?/u, `$1${modifier}`);
  // Unicode lists every sequence that takes a tone, so families and pairs, which need one per person, stay as they are.
  return RGI_EMOJI.test(toned) ? toned : emoji;
}

/** The emoji without its tones, as the shortcode set names it; a tone stands where a text-style base takes U+FE0F. */
export const withoutSkinTone = (emoji: string) =>
  qualified(emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "\uFE0F"));

// Emojibase adds U+FE0F to emoji like 👍 that have a text style but already default to emoji.
export const qualified = (emoji: string) =>
  emoji.replace(/(\p{Emoji_Presentation})\uFE0F/gu, "$1");

/** An emoji, its shortcodes (the first being the one it is known by) and the keywords that also find it. */
export type EmojiShortcodes = [
  emoji: string,
  shortcodes: string[],
  keywords: string[],
];

export interface EmojiMatch {
  emoji: string;
  name: string;
}

function rank(shortcode: string, query: string): number {
  if (shortcode === query) return 0;
  if (shortcode.startsWith(query)) return 1;
  if (shortcode.includes(`_${query}`)) return 2;
  return shortcode.includes(query) ? 3 : Infinity;
}

// After every shortcode match, and only whole, as Discord matches them.
const KEYWORD = 4;

/** Matches best first, each named by the shortcode that matched, or by its own for a keyword. */
export function searchEmoji(
  emoji: EmojiShortcodes[],
  query: string,
  limit: number,
): EmojiMatch[] {
  const needle = query.toLowerCase();
  return emoji
    .flatMap(([emoji, shortcodes, keywords]) => {
      let best: (EmojiMatch & { rank: number }) | undefined;
      for (const name of shortcodes) {
        const score = rank(name, needle);
        if (score < (best?.rank ?? Infinity))
          best = { emoji, name, rank: score };
      }
      const [name] = shortcodes;
      if (!best && name && keywords.includes(needle))
        best = { emoji, name, rank: KEYWORD };
      return best ? [best] : [];
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ emoji, name }) => ({ emoji, name }));
}
