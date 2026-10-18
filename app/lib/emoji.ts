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

// Emojibase adds U+FE0F to emoji like 👍 that have a text style but already default to emoji.
export const qualified = (emoji: string) =>
  emoji.replace(/(\p{Emoji_Presentation})\uFE0F/gu, "$1");

/** An emoji and its shortcodes, the first being the one it is known by. */
export type EmojiShortcodes = [emoji: string, ...shortcodes: string[]];

/** Each shortcode's emoji. */
export const emojiByShortcode = (emoji: EmojiShortcodes[]) =>
  new Map(
    emoji.flatMap(([glyph, ...names]) =>
      names.map((name) => [name, glyph] as const),
    ),
  );

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

/** Matches best first, each named by the shortcode that matched. */
export function searchEmoji(
  emoji: EmojiShortcodes[],
  query: string,
  limit: number,
): EmojiMatch[] {
  const needle = query.toLowerCase();
  return emoji
    .flatMap(([emoji, ...shortcodes]) => {
      let best: (EmojiMatch & { rank: number }) | undefined;
      for (const name of shortcodes) {
        const score = rank(name, needle);
        if (score < (best?.rank ?? Infinity))
          best = { emoji, name, rank: score };
      }
      return best ? [best] : [];
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ emoji, name }) => ({ emoji, name }));
}
