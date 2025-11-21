"use server";

import { connection } from "next/server";

import {
  userGetRecentTracks,
  type UserGetRecentTracksResponse,
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
