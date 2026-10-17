import { describe, expect, it } from "vitest";

import { MAX_TEXT_LENGTH, maxTextLength } from "./messageLength";

describe("maxTextLength", () => {
  it("leaves room for the username prefix", () => {
    expect(maxTextLength("test-user")).toBe(1989);
  });
});

describe("MAX_TEXT_LENGTH", () => {
  it("leaves room for the longest generated username", () => {
    expect(MAX_TEXT_LENGTH).toBe(1970);
  });
});
