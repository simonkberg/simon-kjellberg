import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { mockReducedMotion } from "@/mocks/matchMedia";

import { useMotion } from "./useMotion";

describe("useMotion", () => {
  it("follows the reduced motion preference", () => {
    const change = mockReducedMotion(false);
    const { result } = renderHook(useMotion);
    expect(result.current).toBe(true);

    act(() => change(true));

    expect(result.current).toBe(false);
  });

  it("doesn't animate in server markup", () => {
    const Probe = () => String(useMotion());

    expect(renderToString(createElement(Probe))).toBe("false");
  });
});
