import { vi } from "vitest";

import { fallbackThemeColor, preferences } from "@/lib/preferences";

const root = document.documentElement;

export function resetPreferences() {
  for (const { name } of preferences) {
    root.removeAttribute(`data-${name}`);
    document.cookie = `${name}=; max-age=0; path=/`;
  }
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.remove();
  }
}

export function renderThemeColorTags() {
  return fallbackThemeColor.map(({ media, color }) => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("media", media);
    meta.content = color;
    document.head.append(meta);
    return meta;
  });
}

// What the browser uses for each scheme: the first tag matching its media.
export function themeColors() {
  const tags = [
    ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
  ];
  return fallbackThemeColor.map(
    ({ media }) =>
      tags.find((meta) => meta.getAttribute("media") === media)?.content,
  );
}

// happy-dom resolves no colours, so the root's ground reads as its variant and theme.
export function groundPerScheme() {
  const getComputedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    if (element !== root) return getComputedStyle(element);
    return {
      backgroundColor: `${root.getAttribute("data-variant")} ${root.getAttribute("data-theme")}`,
    } as CSSStyleDeclaration;
  });
}
