import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GetTopTracksResult } from "@/actions/lastfm";

import { TopTracksTable } from "./TopTracksTable";

describe("TopTracksTable", () => {
  it("should render tracks in a table", () => {
    const result: GetTopTracksResult = {
      status: "ok",
      tracks: [
        { name: "Track 1", artist: "Artist 1", playcount: 100, rank: 1 },
        { name: "Track 2", artist: "Artist 2", playcount: 50, rank: 2 },
      ],
    };

    render(<TopTracksTable result={result} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Track 1")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Track 2")).toBeInTheDocument();
  });

  it("should render error message on failure", () => {
    const result: GetTopTracksResult = {
      status: "error",
      error: "Failed to fetch",
    };

    render(<TopTracksTable result={result} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
