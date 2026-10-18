import { describe, expect, it } from "vitest";

import { LruMap } from "./LruMap";

describe("LruMap", () => {
  it("sets, updates and gets values", () => {
    const cache = new LruMap<string, number>(3);
    cache.set("a", 1);
    cache.set("a", 2);

    expect(cache.get("a")).toBe(2);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the least recently set item when capacity is exceeded", () => {
    const cache = new LruMap<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("keeps an item it just read", () => {
    const cache = new LruMap<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("keeps an item it just updated", () => {
    const cache = new LruMap<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    cache.set("c", 3);

    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBeUndefined();
  });

  it("deletes and clears items", () => {
    const cache = new LruMap<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.delete("a")).toBe(true);
    expect(cache.delete("a")).toBe(false);
    expect(cache.get("a")).toBeUndefined();

    cache.clear();

    expect(cache.get("b")).toBeUndefined();
  });
});
