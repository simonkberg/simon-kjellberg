import { z } from "zod";

/** One emoji as Discord stores a reaction's name, skin tones and ZWJ sequences included. */
export const EmojiSchema = z.string().regex(/^\p{RGI_Emoji}$/v);

/** The picker's set, kept small since it ships to every visitor. */
export const REACTION_EMOJI = [
  { emoji: "👍", name: "thumbsup" },
  { emoji: "👎", name: "thumbsdown" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😂", name: "joy" },
  { emoji: "🤣", name: "rofl" },
  { emoji: "😭", name: "sob" },
  { emoji: "😮", name: "open_mouth" },
  { emoji: "😢", name: "cry" },
  { emoji: "😡", name: "rage" },
  { emoji: "🎉", name: "tada" },
  { emoji: "🔥", name: "fire" },
  { emoji: "👀", name: "eyes" },
  { emoji: "🙏", name: "pray" },
  { emoji: "👏", name: "clap" },
  { emoji: "🙌", name: "raised_hands" },
  { emoji: "💯", name: "100" },
  { emoji: "🤔", name: "thinking" },
  { emoji: "😍", name: "heart_eyes" },
  { emoji: "😅", name: "sweat_smile" },
  { emoji: "😊", name: "blush" },
  { emoji: "🙂", name: "slightly_smiling_face" },
  { emoji: "😎", name: "sunglasses" },
  { emoji: "😬", name: "grimacing" },
  { emoji: "🥲", name: "smiling_face_with_tear" },
  { emoji: "🤯", name: "exploding_head" },
  { emoji: "💀", name: "skull" },
  { emoji: "🤝", name: "handshake" },
  { emoji: "👋", name: "wave" },
  { emoji: "✨", name: "sparkles" },
  { emoji: "🚀", name: "rocket" },
  { emoji: "✅", name: "white_check_mark" },
  { emoji: "❌", name: "x" },
] as const;
