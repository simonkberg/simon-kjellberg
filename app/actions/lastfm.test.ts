import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserGetRecentTracksResponse } from "@/lib/lastfm";

describe("getRecentTracks", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it("should return success status with tracks when client succeeds", async () => {
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

    const mockGetRecentTracks = vi.fn().mockResolvedValue(mockTracks);
    const mockConnection = vi.fn();

    vi.doMock(import("@/lib/lastfm"), () => ({
      LastFmClient: vi.fn().mockImplementation(function (this: {
        user: { getRecentTracks: typeof mockGetRecentTracks };
      }) {
        this.user = {
          getRecentTracks: mockGetRecentTracks,
        };
      }),
    }));

    vi.doMock(import("next/server"), () => ({
      connection: mockConnection,
    }));

    const { getRecentTracks } = await import("./lastfm");
    const result = await getRecentTracks();

    expect(mockConnection).toHaveBeenCalled();
    expect(mockGetRecentTracks).toHaveBeenCalledWith("magijo", { limit: 5 });
    expect(result).toEqual({
      status: "ok",
      tracks: mockTracks,
    });
  });

  it("should return error status when client fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockError = new Error("API error");
    const mockGetRecentTracks = vi.fn().mockRejectedValue(mockError);
    const mockConnection = vi.fn();

    vi.doMock(import("@/lib/lastfm"), () => ({
      LastFmClient: vi.fn().mockImplementation(function (this: {
        user: { getRecentTracks: typeof mockGetRecentTracks };
      }) {
        this.user = {
          getRecentTracks: mockGetRecentTracks,
        };
      }),
    }));

    vi.doMock(import("next/server"), () => ({
      connection: mockConnection,
    }));

    const { getRecentTracks } = await import("./lastfm");
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
