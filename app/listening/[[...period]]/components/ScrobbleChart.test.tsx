import { Globals } from "@react-spring/web";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ScrobbleCount } from "@/actions/lastfm";

import { ScrobbleChart } from "./ScrobbleChart";

const scrobbles: ScrobbleCount[] = [
  { label: "Oct 20", count: 100, current: false },
  { label: "Oct 21", count: 300, current: false },
  { label: "Oct 22", count: 200, current: false },
  { label: "Oct 23", count: 10, current: true },
];

const renderChart = (items: readonly ScrobbleCount[] | undefined) =>
  act(async () => render(<ScrobbleChart scrobbles={Promise.resolve(items)} />));

const ticks = () =>
  [...document.querySelectorAll(".tick")].map((tick) => tick.textContent);

describe("ScrobbleChart", () => {
  it("names each bucket's count, the current one so far", async () => {
    await renderChart(scrobbles);

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual([
      "Oct 20: 100Oct 20",
      "Oct 21: 300300Oct 21",
      "Oct 22: 200Oct 22",
      "Oct 23: 10 so farOct 23",
    ]);
  });

  it("averages the settled buckets only", async () => {
    await renderChart(scrobbles);

    expect(document.querySelector(".average")).toHaveTextContent("200 avg");
  });

  it("scales a lone empty bucket with no average to show", async () => {
    await renderChart([{ label: "2026", count: 0, current: true }]);

    const figure = document.querySelector<HTMLElement>(".stems");
    expect(figure?.style.getPropertyValue("--max")).toBe("1");
    expect(figure?.querySelector(".average")).not.toBeInTheDocument();
  });

  it("labels every other few buckets from the current one", async () => {
    await renderChart(
      Array.from({ length: 13 }, (_, index) => ({
        label: `W${index}`,
        count: index,
        current: false,
      })),
    );

    expect(ticks()).toEqual(["W0", "W3", "W6", "W9", "W12"]);
    expect(document.querySelector('[data-tick="narrow"]')).toHaveTextContent(
      "W0",
    );
  });

  it("grows the stems in when mounted on the client", async () => {
    Globals.assign({ skipAnimation: false });

    await renderChart(scrobbles);

    const grow = screen
      .getAllByRole("listitem")
      .map((item) => Number(item.style.getPropertyValue("--grow")));
    expect(Math.max(...grow)).toBeLessThan(1);
  });

  it("renders full stems in server markup", () => {
    // A resolved promise still suspends on the server, so render the settled tree.
    const html = renderToString(
      <ScrobbleChart
        scrobbles={Object.assign(Promise.resolve(scrobbles), {
          status: "fulfilled",
          value: scrobbles,
        })}
      />,
    );

    expect(html).toContain("--grow:1");
  });

  it("says so when the counts failed to load", async () => {
    await renderChart(undefined);

    expect(
      screen.getByText("Scrobbles are temporarily unavailable :("),
    ).toBeInTheDocument();
  });
});
