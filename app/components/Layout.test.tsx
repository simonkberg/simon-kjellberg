import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Layout } from "@/components/Layout";
import { config } from "@/config";
import { grounds, preferencesScript } from "@/lib/preferences";

vi.mock(import("@/assets/fonts"), () => ({
  iosevka: {
    className: "iosevka-mock-class",
    variable: "iosevka-mock-variable",
    style: { fontFamily: "Iosevka" },
  },
}));

const renderLayout = (children?: ReactNode) =>
  render(<Layout>{children}</Layout>, { container: document });

describe("Layout", () => {
  it("should render children content", () => {
    renderLayout("Test Content");

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should set lang attribute to en on html element", () => {
    renderLayout();

    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("should apply font class to html element", () => {
    renderLayout();

    expect(document.documentElement).toHaveClass("iosevka-mock-variable");
  });

  it("should default to the panes variant and the system theme", () => {
    renderLayout();

    expect(document.documentElement).toHaveAttribute("data-variant", "panes");
    expect(document.documentElement).toHaveAttribute("data-theme", "system");
  });

  it("should colour the browser with the fallback variant's ground", () => {
    renderLayout();

    const tags = document.head.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    expect(
      [...tags].map((meta) => [meta.getAttribute("media"), meta.content]),
    ).toEqual([
      ["(prefers-color-scheme: light)", grounds.panes.light],
      ["(prefers-color-scheme: dark)", grounds.panes.dark],
    ]);
  });

  it("should apply the saved preferences from the head", () => {
    renderLayout();

    expect(document.head.querySelector("script")?.textContent).toBe(
      preferencesScript,
    );
  });

  it("should include Google Tag Manager with correct ID", () => {
    renderLayout();

    expect(
      document.body.querySelector("script[id=_next-gtm-init]"),
    ).toBeInTheDocument();
    expect(document.body.querySelector("script[id=_next-gtm]")).toHaveAttribute(
      "src",
      `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`,
    );
  });
});
