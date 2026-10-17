import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  groundPerScheme,
  renderThemeColorTags,
  resetPreferences,
  themeColors,
} from "@/mocks/preferences";

import {
  applySavedPreferences,
  fallbackThemeColor,
  preferenceCookie,
  preferences,
  preferencesScript,
  syncThemeColor,
  variantPreference,
} from "./preferences";

const root = document.documentElement;

afterEach(() => {
  resetPreferences();
  vi.restoreAllMocks();
});

describe("applySavedPreferences", () => {
  it("applies every saved option to the root", () => {
    for (const preference of preferences) {
      for (const option of preference.options) {
        root.setAttribute(`data-${preference.name}`, preference.fallback);
        document.cookie = preferenceCookie(preference, option);

        applySavedPreferences(preferences);

        expect(root).toHaveAttribute(`data-${preference.name}`, option);
      }
    }
  });

  it("leaves the fallbacks without valid cookies", () => {
    root.setAttribute("data-variant", "panes");
    root.setAttribute("data-theme", "system");
    document.cookie = "myvariant=manual; path=/";
    document.cookie = "variant=neon; path=/";
    document.cookie = "theme=sepia; path=/";

    applySavedPreferences(preferences);

    expect(root).toHaveAttribute("data-variant", "panes");
    expect(root).toHaveAttribute("data-theme", "system");
    document.cookie = "myvariant=; max-age=0; path=/";
  });

  it("is what the head script runs, with every option", () => {
    expect(preferencesScript).toContain(applySavedPreferences.toString());
    expect(preferencesScript).toContain(syncThemeColor.toString());
    for (const preference of preferences) {
      expect(preferencesScript).toContain(JSON.stringify(preference.options));
    }
  });
});

describe("syncThemeColor", () => {
  it("gives each scheme its ground under the system theme", () => {
    root.setAttribute("data-variant", "ledger");
    root.setAttribute("data-theme", "system");
    renderThemeColorTags();
    groundPerScheme();

    syncThemeColor();

    expect(themeColors()).toEqual(["ledger light", "ledger dark"]);
    expect(root).toHaveAttribute("data-theme", "system");
  });

  it("gives every tag the chosen theme's ground", () => {
    root.setAttribute("data-variant", "manual");
    root.setAttribute("data-theme", "dark");
    renderThemeColorTags();
    groundPerScheme();

    syncThemeColor();

    expect(themeColors()).toEqual(["manual dark", "manual dark"]);
  });

  it("leaves the rendered tags as React rendered them", () => {
    root.setAttribute("data-variant", "ledger");
    root.setAttribute("data-theme", "light");
    const rendered = renderThemeColorTags();
    groundPerScheme();

    syncThemeColor();
    root.setAttribute("data-theme", "dark");
    syncThemeColor();

    expect(themeColors()).toEqual(["ledger dark", "ledger dark"]);
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(
      4,
    );
    expect(rendered.map((meta) => meta.content)).toEqual(
      fallbackThemeColor.map(({ color }) => color),
    );
  });

  it("drops the copies of tags React replaced", () => {
    root.setAttribute("data-variant", "manual");
    root.setAttribute("data-theme", "light");
    const rendered = renderThemeColorTags();
    groundPerScheme();
    syncThemeColor();

    for (const meta of rendered) meta.remove();
    renderThemeColorTags();
    root.setAttribute("data-theme", "dark");
    syncThemeColor();

    expect(themeColors()).toEqual(["manual dark", "manual dark"]);
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(
      4,
    );
  });
});

describe("fallbackThemeColor", () => {
  it("is the fallback variant's ground", () => {
    const css = readFileSync("app/global.css", "utf8");
    const block = css.slice(
      css.indexOf(`:root[data-variant="${variantPreference.fallback}"]`),
    );
    const [light, dark] = fallbackThemeColor.map(({ color }) => color);

    expect(/--ground: ([^;]+);/.exec(block)?.[1]).toBe(
      `light-dark(${light}, ${dark})`,
    );
  });
});
