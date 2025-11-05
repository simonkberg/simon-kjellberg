import { describe, expect, it } from "vitest";
import { randomName } from "./randomName";

describe("randomName", () => {
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

  it("returns lowercase string", () => {
    const name = randomName();

    expect(name).toBe(name.toLowerCase());
  });
});
