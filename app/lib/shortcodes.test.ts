import { describe, expect, it } from "vitest";

import { emojify } from "./shortcodes";

describe("emojify", () => {
  it.each([
    ["any of an emoji's names", ":book: :open_book:", "📖 📖"],
    ["a name it doesn't know", ":nope::book:", ":nope:📖"],
    ["a name on two emoji, by JoyPixels'", ":dog:", "🐶"],
    ["inline code", "`:book:` :book:", "`:book:` 📖"],
    ["a code block", "```\n:book:\n```", "```\n:book:\n```"],
    ["an escaped colon", "\\:book:", "\\:book:"],
    ["a Discord emoji", "<:book:123>", "<:book:123>"],
    ["a URL", "https://example.com/:book:/", "https://example.com/:book:/"],
  ])("handles %s", (_, text, expected) => {
    expect(emojify(text)).toBe(expected);
  });
});
