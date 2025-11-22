import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GetTopAlbumsResult } from "@/actions/lastfm";

import { TopAlbumsTable } from "./TopAlbumsTable";

describe("TopAlbumsTable", () => {
  it("should render albums in a table", () => {
    const result: GetTopAlbumsResult = {
      status: "ok",
      albums: [
        { name: "Album 1", artist: "Artist 1", playcount: 200, rank: 1 },
        { name: "Album 2", artist: "Artist 2", playcount: 150, rank: 2 },
      ],
    };

    render(<TopAlbumsTable result={result} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Album 1")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("Album 2")).toBeInTheDocument();
  });

  it("should render error message on failure", () => {
    const result: GetTopAlbumsResult = {
      status: "error",
      error: "Failed to fetch",
    };

    render(<TopAlbumsTable result={result} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
