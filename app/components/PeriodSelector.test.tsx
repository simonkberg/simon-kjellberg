import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PeriodSelector } from "./PeriodSelector";

describe("PeriodSelector", () => {
  it("should render all period options", () => {
    render(<PeriodSelector current="overall" />);

    expect(screen.getByRole("link", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 month" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3 months" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "6 months" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 year" })).toBeInTheDocument();
    expect(screen.getByText("all time")).toBeInTheDocument();
  });

  it("should not render current period as a link", () => {
    render(<PeriodSelector current="7day" />);

    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "7 days" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "all time" })).toBeInTheDocument();
  });

  it("should link to correct URLs", () => {
    render(<PeriodSelector current="overall" />);

    expect(screen.getByRole("link", { name: "7 days" })).toHaveAttribute(
      "href",
      "/listening?period=7day",
    );
    expect(screen.getByRole("link", { name: "1 month" })).toHaveAttribute(
      "href",
      "/listening?period=1month",
    );
  });
});
