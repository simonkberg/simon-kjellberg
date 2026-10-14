import { describe, expect, it, vi } from "vitest";

import { replaceShortcodes } from "./shortcodes";

vi.mock(import("server-only"), () => ({}));

describe("replaceShortcodes", () => {
  it.each([
    [":joy:", "😂"],
    ["nice :+1: :tada:", "nice 👍 🎉"],
    [":thumbsup::100:", "👍💯"],
    [":not_an_emoji: stays", ":not_an_emoji: stays"],
    ["at 12:30:45", "at 12:30:45"],
    ["no colons", "no colons"],
  ])("turns %j into %j", (text, expected) => {
    expect(replaceShortcodes(text)).toBe(expected);
  });
});
