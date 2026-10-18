import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Page } from "./Page";

describe("Page", () => {
  it("renders Header with section", () => {
    render(<Page section="Listening">Page content</Page>);

    expect(screen.getByRole("link", { name: "listening" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders children content", () => {
    render(<Page>Page content</Page>);

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders the hosting note and both switches in the footer", () => {
    render(<Page>Page content</Page>);

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: "Railway" }),
    ).toHaveAttribute("href", "https://railway.com?referralCode=wzuAxn");
    expect(within(footer).getByText(/affiliate link/)).toBeVisible();
    expect(within(footer).getByRole("group", { name: "style" })).toBeVisible();
    expect(within(footer).getByRole("group", { name: "theme" })).toBeVisible();
  });
});
