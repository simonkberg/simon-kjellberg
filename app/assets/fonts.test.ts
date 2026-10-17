import { readFileSync } from "node:fs";

import emojibase from "emojibase-data/en/data.json" with { type: "json" };
import { expect, it } from "vitest";

const value = /prop: "unicode-range",\s*value:\s*"([^"]*)"/.exec(
  readFileSync("app/assets/fonts.ts", "utf8"),
)?.[1];
if (value === undefined) throw new Error("No unicode-range in fonts.ts");

const range = value.split(",").map((part) => {
  const [start = "", end = start] = part.trim().slice(2).split("-");
  return [parseInt(start, 16), parseInt(end, 16)] as const;
});

const iosevka = (point: number) =>
  range.some(([start, end]) => start <= point && point <= end);

it.each([0xfe0f, 0x200d, 0xe0067])("leaves U+%s out of Iosevka", (point) => {
  expect(iosevka(point)).toBe(false);
});

it("gives Iosevka every emoji that defaults to text, and none that default to colour", () => {
  for (const { hexcode, type } of emojibase) {
    const [first = "", second] = hexcode.split("-");
    if (second === "FE0F") continue;
    expect(iosevka(parseInt(first, 16)), hexcode).toBe(type === 0);
  }
});
