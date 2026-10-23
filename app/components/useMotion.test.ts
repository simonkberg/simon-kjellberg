import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { useMotion } from "./useMotion";

function mockReducedMotion(matches: boolean) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const get = vi.spyOn(query, "matches", "get").mockReturnValue(matches);
  vi.spyOn(window, "matchMedia").mockReturnValue(query);
  return (next: boolean) => {
    get.mockReturnValue(next);
    query.dispatchEvent(new Event("change"));
  };
}

describe("useMotion", () => {
  it("animates without a reduced motion preference", () => {
    mockReducedMotion(false);

    expect(renderHook(useMotion).result.current).toBe(true);
  });

  it("follows the preference when it changes", () => {
    const change = mockReducedMotion(false);
    const { result } = renderHook(useMotion);

    act(() => change(true));

    expect(result.current).toBe(false);
  });

  it("doesn't animate in server markup", () => {
    const Probe = () => String(useMotion());

    expect(renderToString(createElement(Probe))).toBe("false");
  });
});
