import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { periodLabels } from "@/lib/lastfm";

import { PeriodSelector } from "./PeriodSelector";

vi.mock(import("server-only"), () => ({}));

describe("PeriodSelector", () => {
  it("should render all period options", () => {
    render(<PeriodSelector current="overall" />);

    for (const label of Object.values(periodLabels)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("should render current period without link", () => {
    render(<PeriodSelector current="7day" />);

    expect(screen.getByText("7 days")).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("link", { name: "7 days" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["overall", "7 days", "/listening/7day"],
    ["7day", "all time", "/listening"],
  ] as const)("on %s, should link %s to %s", (current, label, href) => {
    render(<PeriodSelector current={current} />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  });
});
