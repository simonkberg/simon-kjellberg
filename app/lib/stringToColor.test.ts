import { describe, expect, it } from "vitest";

import { djb2hash } from "./djb2hash";
import { stringToColor } from "./stringToColor";

describe("stringToColor", () => {
  it("returns HSL color format", () => {
    const color = stringToColor("test");

    expect(color).toMatch(/^hsl\(\d+ \d+(\.\d+)?% \d+(\.\d+)?%\)$/);
  });

  it("generates consistent color for same input", () => {
    const input = "hello";

    expect(stringToColor(input)).toBe(stringToColor(input));
  });

  it("generates different colors for different inputs", () => {
    expect(stringToColor("hello")).not.toBe(stringToColor("world"));
  });

  it("uses default saturation and lightness", () => {
    const color = stringToColor("test");
    const match = color.match(/^hsl\((\d+) ([\d.]+)% ([\d.]+)%\)$/);

    expect(match?.[2]).toBe("95");
    expect(match?.[3]).toBe("65");
  });

  it("accepts custom saturation", () => {
    const color = stringToColor("test", 0.5);
    const match = color.match(/^hsl\((\d+) ([\d.]+)% ([\d.]+)%\)$/);

    expect(match?.[2]).toBe("50");
    expect(match?.[3]).toBe("65"); // default lightness
  });

  it("accepts custom lightness", () => {
    const color = stringToColor("test", 0.95, 0.8);
    const match = color.match(/^hsl\((\d+) ([\d.]+)% ([\d.]+)%\)$/);

    expect(match?.[2]).toBe("95");
    expect(match?.[3]).toBe("80");
  });

  it("constrains hue to valid range 0-359 using modulo", () => {
    const testString = "test";
    const hash = djb2hash(testString);
    expect(hash).toBeGreaterThan(360); // Verify we're actually testing modulo

    const color = stringToColor(testString);
    const match = color.match(/^hsl\((\d+)/);
    const hue = Number(match?.[1]);

    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("handles empty string", () => {
    const color = stringToColor("");

    expect(color).toMatch(/^hsl\(\d+ \d+(\.\d+)?% \d+(\.\d+)?%\)$/);
  });
});
