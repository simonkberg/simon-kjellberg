import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RelativeTime } from "./RelativeTime";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("RelativeTime", () => {
  let now: number;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    now = Date.now();
  });

  it("renders semantic time element with correct attributes", async () => {
    const testDate = new Date(now - 5 * MINUTE);

    await act(() => render(<RelativeTime date={testDate} />));

    const timeElement = screen.getByText(/5 minutes ago/).closest("time");
    expect(timeElement).toHaveAttribute("dateTime", testDate.toISOString());
    expect(timeElement).toHaveAttribute("title", testDate.toLocaleString());
  });

  it.each([
    { offset: 30 * 1000, expected: /30 seconds ago/ },
    { offset: 30 * MINUTE, expected: /30 minutes ago/ },
    { offset: 5 * HOUR, expected: /5 hours ago/ },
    { offset: 5 * DAY, expected: /5 days ago/ },
    { offset: 60 * DAY, expected: /2 months ago/ },
    { offset: 2 * 365 * DAY, expected: /2 years ago/ },
  ])("displays $expected", async ({ offset, expected }) => {
    await act(() => render(<RelativeTime date={new Date(now - offset)} />));

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    {
      initialOffset: 30 * 1000,
      advanceBy: 1000,
      initialText: /30 seconds ago/,
      updatedText: /31 seconds ago/,
      description: "1 second for recent times",
    },
    {
      initialOffset: 5 * MINUTE,
      advanceBy: MINUTE,
      initialText: /5 minutes ago/,
      updatedText: /6 minutes ago/,
      description: "1 minute for times under an hour",
    },
    {
      initialOffset: 2 * HOUR + 28 * MINUTE,
      advanceBy: 5 * MINUTE,
      initialText: /2 hours ago/,
      updatedText: /3 hours ago/,
      description: "5 minutes for times under a day",
    },
  ])(
    "updates display after $description",
    async ({ initialOffset, advanceBy, initialText, updatedText }) => {
      await act(() =>
        render(<RelativeTime date={new Date(now - initialOffset)} />),
      );

      expect(screen.getByText(initialText)).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(advanceBy);
      });

      expect(screen.getByText(updatedText)).toBeInTheDocument();
    },
  );

  it.each([
    { style: "short" as const, expected: /5 min. ago/ },
    { style: "narrow" as const, expected: /5m ago/ },
  ])('formats with "$style" style', async ({ style, expected }) => {
    await act(() =>
      render(<RelativeTime date={new Date(now - 5 * MINUTE)} style={style} />),
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("updates formatter when style prop changes", async () => {
    const date = new Date(now - 5 * MINUTE);

    const { rerender } = await act(() =>
      render(<RelativeTime date={date} style="long" />),
    );

    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();

    await act(async () => {
      rerender(<RelativeTime date={date} style="narrow" />);
    });

    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
  });

  it("does not update display for times older than a day", async () => {
    await act(() => render(<RelativeTime date={new Date(now - 2 * DAY)} />));

    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});
