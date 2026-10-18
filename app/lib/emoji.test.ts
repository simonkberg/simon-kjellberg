import { describe, expect, it } from "vitest";

import { emojiByShortcode, type EmojiShortcodes, searchEmoji } from "./emoji";

const EMOJI: EmojiShortcodes[] = [
  ["🧑‍🚒", "firefighter"],
  ["🔥", "fire", "flame"],
  ["❤️‍🔥", "heart_on_fire"],
  ["🌋", "volcano", "campfire_mountain"],
  ["💀", "skull", "skeleton"],
];

const search = (query: string, limit = 10) =>
  searchEmoji(EMOJI, query, limit)
    .map(({ emoji }) => emoji)
    .join("");

describe("searchEmoji", () => {
  it("ranks an exact match, then prefixes, then word starts, then the rest", () => {
    expect(search("fire")).toBe("🔥🧑‍🚒❤️‍🔥🌋");
  });

  it("names each match by the shortcode that matched", () => {
    expect(searchEmoji(EMOJI, "skel", 10)).toEqual([
      { emoji: "💀", name: "skeleton" },
    ]);
  });

  it("ignores case, since a shortcode is typed after a capital as often", () => {
    expect(search("SKULL")).toBe("💀");
  });

  it("returns at most the limit", () => {
    expect(search("f", 2)).toBe("🧑‍🚒🔥");
  });

  it("finds nothing for an unknown shortcode", () => {
    expect(search("zzz")).toBe("");
  });
});

describe("emojiByShortcode", () => {
  it("gives a name on two emoji to the one listing it sooner", () => {
    const byName = emojiByShortcode([
      ["🐕", "dog2", "dog"],
      ["🐶", "dog", "dog_face"],
    ]);

    expect(byName.get("dog")).toBe("🐶");
    expect(byName.get("dog2")).toBe("🐕");
  });
});
