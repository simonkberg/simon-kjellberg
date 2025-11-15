"use server";

import { env } from "@/lib/env";
import { LastFmClient, type UserGetRecentTracksResponse } from "@/lib/lastfm";
import { connection } from "next/server";

let lastFmClient: LastFmClient | undefined;

function getLastFmClient() {
  if (!lastFmClient) {
    lastFmClient = new LastFmClient(env.LAST_FM_API_KEY);
  }

  return lastFmClient;
}

export type RecentTrack = UserGetRecentTracksResponse[number];

export type GetRecentTracksResult =
  | { status: "ok"; tracks: RecentTrack[] }
  | { status: "error"; error: string };

export async function getRecentTracks(): Promise<GetRecentTracksResult> {
  await connection();
  try {
    const tracks = await getLastFmClient().user.getRecentTracks("magijo", {
      limit: 5,
    });
    return { status: "ok", tracks };
  } catch (error) {
    console.error("Error fetching recent tracks:", error);
    return { status: "error", error: "Failed to fetch recent tracks" };
  }
}
