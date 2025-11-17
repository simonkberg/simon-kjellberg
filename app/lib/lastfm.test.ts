import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/node";

import { LastFmClient } from "./lastfm";

vi.mock(import("server-only"), () => ({}));

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

describe("LastFmClient", () => {
  describe("user.getRecentTracks", () => {
    it("should fetch and parse recent tracks successfully", async () => {
      server.use(
        http.get(LASTFM_BASE_URL, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("method")).toBe("user.getrecenttracks");
          expect(url.searchParams.get("api_key")).toBe("test-last-fm-api-key");
          expect(url.searchParams.get("user")).toBe("testuser");
          expect(url.searchParams.get("extended")).toBe("1");

          return HttpResponse.json({
            recenttracks: {
              track: [
                {
                  mbid: "track-123",
                  name: "Test Track",
                  artist: { mbid: "artist-123", name: "Test Artist" },
                  album: { mbid: "album-123", "#text": "Test Album" },
                  date: { uts: "1609459200", "#text": "01 Jan 2021" },
                  loved: "1",
                },
                {
                  mbid: "track-456",
                  name: "Another Track",
                  artist: { mbid: "artist-456", "#text": "Another Artist" },
                  album: { mbid: "album-456", "#text": "Another Album" },
                  date: { uts: "1609372800", "#text": "31 Dec 2020" },
                  loved: "0",
                },
              ],
            },
          });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      const tracks = await client.user.getRecentTracks("testuser");

      expect(tracks).toEqual([
        {
          id: "track-123",
          name: "Test Track",
          artist: "Test Artist",
          album: "Test Album",
          playedAt: new Date(1609459200000),
          nowPlaying: false,
          loved: true,
        },
        {
          id: "track-456",
          name: "Another Track",
          artist: "Another Artist",
          album: "Another Album",
          playedAt: new Date(1609372800000),
          nowPlaying: false,
          loved: false,
        },
      ]);
    });

    it("should handle now playing track", async () => {
      server.use(
        http.get(LASTFM_BASE_URL, () => {
          return HttpResponse.json({
            recenttracks: {
              track: [
                {
                  mbid: "track-123",
                  name: "Now Playing Track",
                  artist: { mbid: "artist-123", name: "Test Artist" },
                  album: { mbid: "album-123", "#text": "Test Album" },
                  "@attr": { nowplaying: "true" },
                },
              ],
            },
          });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      const tracks = await client.user.getRecentTracks("testuser");

      expect(tracks[0]?.nowPlaying).toBe(true);
      expect(tracks[0]?.playedAt).toBeUndefined();
    });

    it("should support limit and page parameters", async () => {
      server.use(
        http.get(LASTFM_BASE_URL, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("limit")).toBe("5");
          expect(url.searchParams.get("page")).toBe("2");

          return HttpResponse.json({
            recenttracks: {
              track: [],
            },
          });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      await client.user.getRecentTracks("testuser", { limit: 5, page: 2 });
    });

    it("should handle invalid response schema", async () => {
      server.use(
        http.get(LASTFM_BASE_URL, () => {
          return HttpResponse.json({
            invalid: "data",
          });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      await expect(client.user.getRecentTracks("testuser")).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      server.use(
        http.get(LASTFM_BASE_URL, () => {
          return HttpResponse.error();
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      await expect(client.user.getRecentTracks("testuser")).rejects.toThrow();
    });

    it("should configure fetch with 3 second timeout", async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

      server.use(
        http.get(LASTFM_BASE_URL, () => {
          return HttpResponse.json({
            recenttracks: {
              track: [],
            },
          });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      await client.user.getRecentTracks("testuser");

      expect(timeoutSpy).toHaveBeenCalledWith(3000);
      timeoutSpy.mockRestore();
    });

    it.each([
      { status: 404, statusText: "Not Found" },
      { status: 429, statusText: "Too Many Requests" },
      { status: 500, statusText: "Internal Server Error" },
      { status: 503, statusText: "Service Unavailable" },
    ])("should handle HTTP $status error", async ({ status, statusText }) => {
      server.use(
        http.get(LASTFM_BASE_URL, () => {
          return new HttpResponse(null, { status, statusText });
        }),
      );

      const client = new LastFmClient("test-last-fm-api-key");
      await expect(client.user.getRecentTracks("testuser")).rejects.toThrow(
        `Last.fm API error: ${status} ${statusText}`,
      );
    });
  });
});
