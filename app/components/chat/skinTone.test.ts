import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SKIN_TONES } from "@/lib/emoji";

import { setSkinTone, useSkinTone } from "./skinTone";

afterEach(() => {
  localStorage.clear();
});

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

    pickInAnotherTab("4");

    expect(result.current).toBe(SKIN_TONES[4]);
  });

  function failToSave(tone: (typeof SKIN_TONES)[number]) {
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    const hook = renderHook(useSkinTone);
    act(() => setSkinTone(tone));
    setItem.mockRestore();
    return hook;
  }

  function pickInAnotherTab(tone: string) {
    act(() => {
      localStorage.setItem("skin-tone", tone);
      window.dispatchEvent(new StorageEvent("storage", { key: "skin-tone" }));
    });
  }

  it("keeps a pick storage won't save for the visit", () => {
    localStorage.setItem("skin-tone", "1");

    expect(failToSave(SKIN_TONES[3]).result.current).toBe(SKIN_TONES[3]);
  });

  it("lets a pick that saves replace an unsaved one", () => {
    const { result } = failToSave(SKIN_TONES[3]);

    act(() => setSkinTone(SKIN_TONES[5]));

    expect(result.current).toBe(SKIN_TONES[5]);
    expect(localStorage.getItem("skin-tone")).toBe("5");
  });

  it("lets another tab's pick replace an unsaved one", () => {
    const { result } = failToSave(SKIN_TONES[3]);

    pickInAnotherTab("2");

    expect(result.current).toBe(SKIN_TONES[2]);
  });
});
