import { describe, expect, it } from "vitest";

import { type EmojiShortcodes, searchEmoji, withSkinTone } from "./emoji";

const EMOJI: EmojiShortcodes[] = [
  ["🧑‍🚒", ["firefighter"], []],
  ["🔥", ["fire", "flame"], []],
  ["❤️‍🔥", ["heart_on_fire"], []],
  ["🌋", ["volcano", "campfire_mountain"], []],
  ["💀", ["skull", "skeleton"], ["dead"]],
  ["😵", ["dizzy_face"], ["dead"]],
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

  it("finds a whole keyword after every shortcode, named by its own", () => {
    expect(searchEmoji(EMOJI, "dead", 10)).toEqual([
      { emoji: "💀", name: "skull" },
      { emoji: "😵", name: "dizzy_face" },
    ]);
    expect(search("dea")).toBe("");
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

describe("withSkinTone", () => {
  it.each([
    ["👍", "\u{1F3FC}", "👍🏼"],
    ["☝️", "\u{1F3FC}", "☝🏼"],
    ["🧑‍🚒", "\u{1F3FC}", "🧑🏼‍🚒"],
    ["👨‍👩‍👧", "\u{1F3FC}", "👨‍👩‍👧"],
    ["👍", "", "👍"],
  ])("tones %s with %j as %s", (emoji, modifier, toned) => {
    expect(withSkinTone(emoji, modifier)).toBe(toned);
  });
});
