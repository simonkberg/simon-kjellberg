import { gemoji } from "gemoji";
import { describe, expect, it } from "vitest";

import { EmojiSchema, REACTION_EMOJI } from "./emoji";

describe("REACTION_EMOJI", () => {
  it.each(REACTION_EMOJI)(
    "names $emoji by its shortcode",
    ({ emoji, name }) => {
      expect(gemoji.find((entry) => entry.names.includes(name))?.emoji).toBe(
        emoji,
      );
    },
  );

  it.each(REACTION_EMOJI)("accepts $emoji as a reaction", ({ emoji }) => {
    expect(EmojiSchema.safeParse(emoji).success).toBe(true);
  });
});

describe("EmojiSchema", () => {
  it.each(["👍🏽", "🏳️‍🌈", "1️⃣"])("accepts %s", (emoji) => {
    expect(EmojiSchema.safeParse(emoji).success).toBe(true);
  });

  it.each(["", "a", "👍👍", "👍 ", ":joy:"])("rejects %j", (text) => {
    expect(EmojiSchema.safeParse(text).success).toBe(false);
  });
});
