import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WakaTimeStatsResult } from "@/actions/wakaTime";

import { StatsList } from "./StatsList";

const renderStats = (result: WakaTimeStatsResult) =>
  act(() => render(<StatsList stats={Promise.resolve(result)} />));

describe("StatsList", () => {
  it("renders stats as list items", async () => {
    await renderStats({
      status: "ok",
      stats: [
        { name: "TypeScript", percent: 45.67 },
        { name: "JavaScript", percent: 30.12 },
      ],
    });

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);

    expect(items[0]).toHaveTextContent("TypeScript 45.67%");
    expect(items[1]).toHaveTextContent("JavaScript 30.12%");
  });

  it("displays error message when stats fetch fails", async () => {
    await renderStats({ status: "error", error: "Failed to fetch stats" });

    expect(
      screen.getByText("Language statistics are temporarily unavailable :("),
    ).toBeInTheDocument();
  });

  it("displays empty state message when stats array is empty", async () => {
    await renderStats({ status: "ok", stats: [] });

    expect(screen.getByText(/probably on vacation/)).toBeInTheDocument();
  });
});
