import { describe, expect, it } from "vitest";
import { codePointsToString } from "./codePointsToString";

describe("codePointsToString", () => {
  it("converts single basic code point to string", () => {
    expect(codePointsToString("1F600")).toBe("😀");
  });

  it("converts single code point below BMP", () => {
    expect(codePointsToString("0041")).toBe("A");
  });

  it("converts multiple code points separated by dash", () => {
    expect(codePointsToString("1F468-200D-1F4BB")).toBe("👨‍💻");
  });

  it("converts sequence of multiple emojis", () => {
    expect(codePointsToString("1F1FA-1F1F8")).toBe("🇺🇸");
  });

  it("handles code points in supplementary plane", () => {
    expect(codePointsToString("1F914")).toBe("🤔");
  });

  it("handles zero-width joiner sequences", () => {
    expect(
      codePointsToString("1F469-200D-2764-FE0F-200D-1F48B-200D-1F469"),
    ).toBe("👩‍❤️‍💋‍👩");
  });

  it("handles skin tone modifiers", () => {
    expect(codePointsToString("1F44B-1F3FB")).toBe("👋🏻");
  });
});
