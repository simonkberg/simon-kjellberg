import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { setSkinTone, useSkinTone } from "./skinTone";

afterEach(() => {
  localStorage.clear();
});

describe("useSkinTone", () => {
  it("starts at the default, ignoring a stored value out of range", () => {
    localStorage.setItem("skin-tone", "9");

    expect(renderHook(useSkinTone).result.current).toBe(0);
  });

  it("follows a tone picked in another tab", () => {
    const { result } = renderHook(useSkinTone);

    act(() => {
      localStorage.setItem("skin-tone", "4");
      window.dispatchEvent(new StorageEvent("storage", { key: "skin-tone" }));
    });

    expect(result.current).toBe(4);
  });

  it("keeps a tone for the visit when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(useSkinTone);

    act(() => setSkinTone(3));

    expect(result.current).toBe(3);
  });
});
