"use server";

import { cacheLife } from "next/cache";
import { connection } from "next/server";

import {
  type Period,
  userGetRecentTracks,
  type UserGetRecentTracksResponse,
  userGetTopAlbums,
  type UserGetTopAlbumsResponse,
  userGetTopArtists,
  type UserGetTopArtistsResponse,
  userGetTopTracks,
  type UserGetTopTracksResponse,
} from "@/lib/lastfm";

export type RecentTrack = UserGetRecentTracksResponse[number];

export type GetRecentTracksResult =
  | { status: "ok"; tracks: RecentTrack[] }
  | { status: "error"; error: string };

export async function getRecentTracks(): Promise<GetRecentTracksResult> {
  await connection();
  try {
    const tracks = await userGetRecentTracks("magijo", { limit: 5 });
    return { status: "ok", tracks };
  } catch (error) {
    console.error("Error fetching recent tracks:", error);
    return { status: "error", error: "Failed to fetch recent tracks" };
  }
}

export type TopTrack = UserGetTopTracksResponse[number];
export type TopArtist = UserGetTopArtistsResponse[number];
export type TopAlbum = UserGetTopAlbumsResponse[number];

export type GetTopTracksResult =
  | { status: "ok"; tracks: TopTrack[] }
  | { status: "error"; error: string };

export type GetTopArtistsResult =
  | { status: "ok"; artists: TopArtist[] }
  | { status: "error"; error: string };

export type GetTopAlbumsResult =
  | { status: "ok"; albums: TopAlbum[] }
  | { status: "error"; error: string };

export async function getTopTracks(
  period: Period,
): Promise<GetTopTracksResult> {
  "use cache";
  cacheLife("hours");

  try {
    const tracks = await userGetTopTracks("magijo", { period, limit: 10 });
    return { status: "ok", tracks };
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return { status: "error", error: "Failed to fetch top tracks" };
  }
}

export async function getTopArtists(
  period: Period,
): Promise<GetTopArtistsResult> {
  "use cache";
  cacheLife("hours");

  try {
    const artists = await userGetTopArtists("magijo", { period, limit: 10 });
    return { status: "ok", artists };
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return { status: "error", error: "Failed to fetch top artists" };
  }
}

export async function getTopAlbums(
  period: Period,
): Promise<GetTopAlbumsResult> {
  "use cache";
  cacheLife("hours");

  try {
    const albums = await userGetTopAlbums("magijo", { period, limit: 10 });
    return { status: "ok", albums };
  } catch (error) {
    console.error("Error fetching top albums:", error);
    return { status: "error", error: "Failed to fetch top albums" };
  }
}
