import { connection } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  userGetRecentTracks,
  type UserGetRecentTracksResponse,
} from "@/lib/lastfm";

import { getRecentTracks } from "./lastfm";

vi.mock(import("@/lib/lastfm"), () => ({
  userGetRecentTracks: vi.fn(),
}));

vi.mock(import("next/server"), () => ({
  connection: vi.fn(),
}));

describe("getRecentTracks", () => {
  it("should return success status with tracks when userGetRecentTracks succeeds", async () => {
    const mockTracks: UserGetRecentTracksResponse = [
      {
        id: "track-123",
        name: "Test Track",
        artist: "Test Artist",
        album: "Test Album",
        playedAt: new Date("2021-01-01T00:00:00Z"),
        nowPlaying: false,
        loved: true,
      },
      {
        id: "track-456",
        name: "Another Track",
        artist: "Another Artist",
        album: "Another Album",
        playedAt: new Date("2021-01-02T00:00:00Z"),
        nowPlaying: false,
        loved: false,
      },
    ];

    vi.mocked(userGetRecentTracks).mockResolvedValue(mockTracks);

    const result = await getRecentTracks();

    expect(connection).toHaveBeenCalled();
    expect(userGetRecentTracks).toHaveBeenCalledWith("magijo", { limit: 5 });
    expect(result).toEqual({
      status: "ok",
      tracks: mockTracks,
    });
  });

  it("should return error status when userGetRecentTracks fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockError = new Error("API error");
    vi.mocked(userGetRecentTracks).mockRejectedValue(mockError);

    const result = await getRecentTracks();

    expect(result).toEqual({
      status: "error",
      error: "Failed to fetch recent tracks",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching recent tracks:",
      mockError,
    );

    consoleErrorSpy.mockRestore();
  });
});
