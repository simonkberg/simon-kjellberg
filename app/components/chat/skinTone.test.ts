import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SKIN_TONES } from "@/lib/emoji";

import { setSkinTone, useSkinTone } from "./skinTone";

describe("useSkinTone", () => {
  it("starts at the default, ignoring a stored value out of range", () => {
    localStorage.setItem("skin-tone", "9");

    expect(renderHook(useSkinTone).result.current).toBe(SKIN_TONES[0]);
  });

  it("starts at the default where storage can't be read", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(renderHook(useSkinTone).result.current).toBe(SKIN_TONES[0]);
  });

  it("follows a tone picked in another tab", () => {
    const { result } = renderHook(useSkinTone);

    act(() => {
      localStorage.setItem("skin-tone", "4");
      window.dispatchEvent(new StorageEvent("storage", { key: "skin-tone" }));
    });

    expect(result.current).toBe(SKIN_TONES[4]);
  });

  it("keeps a pick storage won't save for the visit", () => {
    localStorage.setItem("skin-tone", "1");
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    const { result } = renderHook(useSkinTone);

    act(() => setSkinTone(SKIN_TONES[3]));

    expect(result.current).toBe(SKIN_TONES[3]);
  });
});
