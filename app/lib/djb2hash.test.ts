import { describe, expect, it } from "vitest";

import { djb2hash } from "./djb2hash";

describe("djb2hash", () => {
  it("returns 0 for empty string", () => {
    expect(djb2hash("")).toBe(0);
  });

  it("generates consistent hash for same input", () => {
    const input = "hello";
    expect(djb2hash(input)).toBe(djb2hash(input));
  });

  it("generates different hashes for different inputs", () => {
    expect(djb2hash("hello")).not.toBe(djb2hash("world"));
  });

  it("generates different hashes for similar strings", () => {
    expect(djb2hash("test")).not.toBe(djb2hash("Test"));
  });

  it("handles single character", () => {
    expect(djb2hash("a")).toBe(177604);
  });

  it("handles multi-character strings", () => {
    expect(djb2hash("test")).toBe(2087956275);
  });

  it("handles special characters", () => {
    expect(djb2hash("!@#$")).toBe(2085358563);
  });

  it("handles unicode characters", () => {
    expect(djb2hash("😀")).toBe(5308056);
  });
});
