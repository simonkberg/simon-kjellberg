import { describe, expect, it, vi } from "vitest";

import { REACTION_EMOJI } from "./emoji";
import { replaceShortcodes } from "./shortcodes";

vi.mock(import("server-only"), () => ({}));

describe("REACTION_EMOJI", () => {
  it.each(REACTION_EMOJI)(
    "names $emoji by its shortcode",
    ({ emoji, name }) => {
      expect(replaceShortcodes(`:${name}:`)).toBe(emoji);
    },
  );
});
