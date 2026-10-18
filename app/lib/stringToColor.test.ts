import { describe, expect, it } from "vitest";

import { stringToColor } from "./stringToColor";

describe("stringToColor", () => {
  it.each<[number[], string]>([
    [[], "hsl(195 95% 65%)"],
    [[0.5], "hsl(195 50% 65%)"],
    [[0.95, 0.8], "hsl(195 95% 80%)"],
  ])("colours test with %j as %s", (options, color) => {
    expect(stringToColor("test", ...options)).toBe(color);
  });
});
