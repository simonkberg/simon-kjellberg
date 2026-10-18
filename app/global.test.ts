import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { variantPreference } from "@/lib/preferences";

const css = readFileSync(join(import.meta.dirname, "global.css"), "utf8");

const declared = (body: string) =>
  new Set([...body.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name));

const defaults = declared(/^:root \{([^}]*)\}/m.exec(css)?.[1] ?? "");
// Top-level blocks only: the narrow-screen tweaks inside @media are indented.
const variants = new Map(
  [...css.matchAll(/^:root\[data-variant="(\w+)"\] \{([^}]*)\}/gm)].map(
    ([, variant, body = ""]) => [variant, declared(body)],
  ),
);
const variantOnly = new Set(
  [...variants.values()].flatMap((names) =>
    [...names].filter((name) => !defaults.has(name)),
  ),
);

describe("global.css", () => {
  it("has a block for every variant", () => {
    expect(new Set(variants.keys())).toEqual(
      new Set(variantPreference.options),
    );
  });

  // A property with no default is unset in any variant that leaves it out.
  it("sets every property without a default in every variant", () => {
    expect(defaults.size).toBeGreaterThan(0);
    for (const [variant, names] of variants) {
      const unset = [...variantOnly].filter((name) => !names.has(name));
      expect({ variant, unset }).toEqual({ variant, unset: [] });
    }
  });
});
