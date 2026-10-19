import { describe, expect, it } from "vitest";

import { type EmojiShortcodes, REACTION_EMOJI } from "@/lib/emoji";

import { GET } from "./route";

const shortcodes = (): Promise<EmojiShortcodes[]> => GET().json();

describe("GET /api/emoji", () => {
  it("names each emoji by JoyPixels' shortcode first", async () => {
    const emoji = await shortcodes();

    expect(emoji.find(([emoji]) => emoji === "💀")?.[1]).toEqual([
      "skull",
      "skeleton",
    ]);
    expect(emoji.find(([emoji]) => emoji === "🙃")?.[1][0]).toBe("upside_down");
  });

  it("knows every reaction by its picker name", async () => {
    const emoji = new Map(
      (await shortcodes()).map(([emoji, names]) => [emoji, names]),
    );

    for (const { emoji: reaction, name } of REACTION_EMOJI) {
      expect(emoji.get(reaction)).toContain(name);
    }
  });

  it("leaves out skin tones and other components", async () => {
    const emoji = (await shortcodes()).map(([emoji]) => emoji);

    expect(emoji).not.toContain("🏽");
    expect(emoji).not.toContain("🇸");
  });

  it("drops flags' bare country codes", async () => {
    const flag = (await shortcodes()).find(([emoji]) => emoji === "🇸🇪");

    expect(flag?.[1]).toContain("flag_se");
    expect(flag?.[1]).not.toContain("se");
  });

  it("keeps the keywords that can be typed and aren't already a shortcode", async () => {
    const emoji = await shortcodes();
    const [, names = [], keywords = []] =
      emoji.find(([emoji]) => emoji === "😂") ?? [];

    expect(keywords).toContain("lol");
    expect(keywords).not.toContain("joy");
    expect(names).toContain("joy");
    expect(emoji.flatMap(([, , keywords]) => keywords)).not.toContain("i’m");
  });
});
