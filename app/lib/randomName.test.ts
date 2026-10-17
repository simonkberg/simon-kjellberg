import { afterEach, describe, expect, it, vi } from "vitest";

import { MAX_NAME_LENGTH } from "./messageLength";
import { randomName } from "./randomName";

/** The name at these fractions of the adjective and animal lists. */
function nameAt(adjective: number, animal: number) {
  vi.spyOn(Math, "random")
    .mockReturnValueOnce(adjective)
    .mockReturnValueOnce(animal);
  return randomName();
}

describe("randomName", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns at least two words separated by dash", () => {
    const name = randomName();

    expect(name).toMatch(/\w+-\w+/);
  });

  it("generates different names on multiple calls", () => {
    const names = new Set();
    for (let i = 0; i < 100; i++) {
      names.add(randomName());
    }

    // With ~100 adjectives and ~200 animals, we should get some variety
    expect(names.size).toBeGreaterThan(50);
  });

  it("returns string with no spaces", () => {
    const name = randomName();

    expect(name).not.toMatch(/\s/);
  });

  it("generates no name longer than the chat input leaves room for", () => {
    // Fine enough to land on every word of either list.
    const fractions = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const longest = (pick: (fraction: number) => string) =>
      Math.max(...fractions.map((fraction) => pick(fraction).length));
    // Lengths add up, so the longest adjective and animal make the longest name.
    const length =
      longest((fraction) => nameAt(fraction, 0)) +
      longest((fraction) => nameAt(0, fraction)) -
      nameAt(0, 0).length;

    expect(length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
  });

  it("returns lowercase string", () => {
    const name = randomName();

    expect(name).toBe(name.toLowerCase());
  });
});
