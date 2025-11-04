"use server";

import { getStats, type WakaTimeStats } from "@/lib/wakaTime";
import { cacheLife } from "next/cache";

export type WakaTimeStatsResult =
  | { status: "ok"; stats: WakaTimeStats }
  | { status: "error"; error: string };

export async function getWakaTimeStats(): Promise<WakaTimeStatsResult> {
  "use cache";
  cacheLife("hours");

  try {
    const stats = await getStats();
    return { status: "ok", stats };
  } catch (error) {
    console.error("Error fetching WakaTime stats:", error);
    cacheLife("seconds");
    return { status: "error", error: "Failed to fetch WakaTime stats" };
  }
}
