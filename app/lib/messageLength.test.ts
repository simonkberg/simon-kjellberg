import { describe, expect, it } from "vitest";

import { MAX_TEXT_LENGTH, maxTextLength } from "./messageLength";
import { MAX_NAME_LENGTH } from "./randomName";

describe("maxTextLength", () => {
  it("leaves room for the username prefix", () => {
    expect(maxTextLength("test-user")).toBe(1989);
  });

  it("allows the input's limit beside the longest generated name", () => {
    expect(maxTextLength("x".repeat(MAX_NAME_LENGTH))).toBeGreaterThanOrEqual(
      MAX_TEXT_LENGTH,
    );
  });
});
