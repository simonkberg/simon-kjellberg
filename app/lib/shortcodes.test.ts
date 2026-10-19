import { describe, expect, it } from "vitest";

import { emojify, SHORTCODES } from "./shortcodes";

it("gives each name to one emoji", () => {
  const names = SHORTCODES.flatMap(([, names]) => names);

  expect(new Set(names).size).toBe(names.length);
});

describe("emojify", () => {
  it.each([
    ["any of an emoji's names", ":book: :open_book:", "📖 📖"],
    [
      "a skin tone after it",
      ":+1::skin-tone-2: :handshake::skin-tone-5:",
      "👍🏼 🤝🏿",
    ],
    ["a skin tone on one without", ":book::skin-tone-2:", "📖:skin-tone-2:"],
    ["a name it doesn't know", ":nope::book:", ":nope:📖"],
    ["a name on two emoji, by JoyPixels'", ":dog: :frowning_face:", "🐶 ☹️"],
    ["inline code", "`:book:` :book:", "`:book:` 📖"],
    ["a backtick run that never closes", "``:book:`", "``📖`"],
    ["an escaped colon", "\\:book:", "\\:book:"],
    ["a Discord token", "<t:100:R>", "<t:100:R>"],
    ["a URL", "https://example.com/:book:/", "https://example.com/:book:/"],
  ])("handles %s", (_, text, expected) => {
    expect(emojify(text)).toBe(expected);
  });
});
