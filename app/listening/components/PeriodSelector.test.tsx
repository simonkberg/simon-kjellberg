import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Period } from "@/lib/lastfm";

import { PeriodSelector } from "./PeriodSelector";

describe("PeriodSelector", () => {
  it("should render all period options", async () => {
    await act(async () =>
      render(<PeriodSelector current={Promise.resolve<Period>("overall")} />),
    );

    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByText("1 month")).toBeInTheDocument();
    expect(screen.getByText("3 months")).toBeInTheDocument();
    expect(screen.getByText("6 months")).toBeInTheDocument();
    expect(screen.getByText("1 year")).toBeInTheDocument();
    expect(screen.getByText("all time")).toBeInTheDocument();
  });

  it("should render current period without link", async () => {
    await act(async () =>
      render(<PeriodSelector current={Promise.resolve<Period>("7day")} />),
    );

    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "7 days" }),
    ).not.toBeInTheDocument();
  });

  it("should render non-current periods as links", async () => {
    await act(async () =>
      render(<PeriodSelector current={Promise.resolve<Period>("overall")} />),
    );

    const link = screen.getByRole("link", { name: "7 days" });
    expect(link).toHaveAttribute("href", "?period=7day");
  });
});
