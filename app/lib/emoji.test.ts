import { gemoji } from "gemoji";
import { describe, expect, it } from "vitest";

import { REACTION_EMOJI } from "./emoji";

describe("REACTION_EMOJI", () => {
  it.each(REACTION_EMOJI)(
    "names $emoji by its shortcode",
    ({ emoji, name }) => {
      expect(gemoji.find((entry) => entry.names.includes(name))?.emoji).toBe(
        emoji,
      );
    },
  );
});
