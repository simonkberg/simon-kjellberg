import { describe, expect, it } from "vitest";

import { djb2hash } from "./djb2hash";

describe("djb2hash", () => {
  it.each([
    ["", 0],
    ["a", 177604],
    ["test", 2087956275],
    ["Test", 2089308947],
    ["!@#$", 2085358563],
    ["😀", 5308056],
  ])("hashes %j to %i", (input, hash) => {
    expect(djb2hash(input)).toBe(hash);
  });
});
