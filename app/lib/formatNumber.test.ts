import { describe, expect, it } from "vitest";

import { formatNumber } from "./formatNumber";

describe("formatNumber", () => {
  it.each([
    [29362, undefined, "29,362"],
    [1234.5, 2, "1,234.50"],
  ])("formats %d with %s decimals as %s", (value, decimals, text) => {
    expect(formatNumber(value, decimals)).toBe(text);
  });
});
