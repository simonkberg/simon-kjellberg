import { describe, expect, it } from "vitest";

import { randomName } from "./randomName";

describe("randomName", () => {
  it("returns lowercase dash-separated words", () => {
    expect(randomName()).toMatch(/^[a-z]+(-[a-z]+)+$/);
  });

  it("generates different names on multiple calls", () => {
    const names = new Set();
    for (let i = 0; i < 100; i++) {
      names.add(randomName());
    }

    expect(names.size).toBeGreaterThan(50);
  });
});
