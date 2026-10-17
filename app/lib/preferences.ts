export interface Preference<T extends string = string> {
  name: "variant" | "theme";
  label: string;
  options: readonly T[];
  fallback: T;
}

export const variantPreference = {
  name: "variant",
  label: "style",
  options: ["panes", "ledger", "manual"],
  fallback: "panes",
} as const satisfies Preference;

// "system" matches no `[data-theme]` rule, so `color-scheme: light dark`
// follows the visitor's OS setting.
export const themePreference = {
  name: "theme",
  label: "theme",
  options: ["system", "light", "dark"],
  fallback: "system",
} as const satisfies Preference;

export const preferences = [variantPreference, themePreference] as const;

// The fallback variant's --ground, for the page before the head script runs.
export const fallbackThemeColor = [
  { media: "(prefers-color-scheme: light)", color: "oklch(0.965 0.004 255)" },
  { media: "(prefers-color-scheme: dark)", color: "oklch(0.19 0.012 255)" },
];

export function preferenceCookie<T extends string>(
  preference: Preference<T>,
  value: T,
) {
  return `${preference.name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

// Stringified into the <head> script, so it references nothing outside itself.
export function applySavedPreferences(saved: readonly Preference[]) {
  for (const { name, options } of saved) {
    const value = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(
      document.cookie,
    )?.[1];
    if (value && options.includes(value)) {
      document.documentElement.setAttribute(`data-${name}`, value);
    }
  }
}

// Stringified too. The rendered tags keep their fallbacks, since React may swap a hoisted <meta>
// for a fresh one, and a copy just before each wins, as the first matching tag does.
export function syncThemeColor() {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme") ?? "system";
  for (const stale of document.querySelectorAll("meta[data-ground]")) {
    stale.remove();
  }
  for (const rendered of document.querySelectorAll(
    'meta[name="theme-color"]',
  )) {
    const media = rendered.getAttribute("media") ?? "";
    // Through data-theme: an inline color-scheme left light-dark() unresolved in Chrome.
    const scheme = /light|dark/.exec(media)?.[0];
    root.setAttribute(
      "data-theme",
      theme === "system" && scheme ? scheme : theme,
    );
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("media", media);
    meta.setAttribute("content", getComputedStyle(root).backgroundColor);
    meta.setAttribute("data-ground", "");
    rendered.before(meta);
  }
  root.setAttribute("data-theme", theme);
}

export const preferencesScript = `(${applySavedPreferences.toString()})(${JSON.stringify(preferences)});(${syncThemeColor.toString()})()`;
