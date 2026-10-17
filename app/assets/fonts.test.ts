import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

type Range = [number, number];

function ranges(value: string): Range[] {
  return value.split(",").map((part) => {
    const [start = "", end = start] = part.trim().slice(2).split("-");
    return [parseInt(start, 16), parseInt(end, 16)];
  });
}

function unicodeRange(source: string, pattern: RegExp): Range[] {
  const value = pattern.exec(source)?.[1];
  if (value === undefined) throw new Error(`No match for ${pattern}`);
  return ranges(value);
}

const covers = (list: Range[], point: number) =>
  list.some(([start, end]) => start <= point && point <= end);

it("leaves exactly the colour emoji range out of Iosevka", () => {
  const emoji = unicodeRange(
    readFileSync("app/global.css", "utf8"),
    /font-family: "Colour Emoji";[^}]*unicode-range:([^;]*);/,
  );
  const iosevka = unicodeRange(
    readFileSync("app/assets/fonts.ts", "utf8"),
    /prop: "unicode-range",\s*value:\s*"([^"]*)"/,
  );
  const edges = [...emoji, ...iosevka].flatMap(([start, end]) => [
    start - 1,
    start,
    end,
    end + 1,
  ]);

  for (const point of edges.filter(
    (point) => point >= 0 && point <= 0x10ffff,
  )) {
    expect(covers(iosevka, point), `U+${point.toString(16)}`).toBe(
      !covers(emoji, point),
    );
  }
});
