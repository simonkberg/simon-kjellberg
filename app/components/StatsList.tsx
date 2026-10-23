import { use } from "react";

import type { WakaTimeStatsResult } from "@/actions/wakaTime";

import { BarList, BarListSkeleton } from "./BarList";

export interface StatsListProps {
  stats: Promise<WakaTimeStatsResult>;
}

export const StatsList = ({ stats }: StatsListProps) => {
  const result = use(stats);

  if (result.status === "error") {
    return <p>Language statistics are temporarily unavailable :(</p>;
  }

  if (result.stats.length === 0) {
    return (
      <p>
        Oops! Looks like the language statistics are currently empty. I&apos;m
        probably on vacation 🌴 (or something is broken).
      </p>
    );
  }

  return (
    <BarList
      bars={result.stats.map((stat) => ({
        label: stat.name,
        value: stat.percent,
      }))}
      decimals={2}
      unit="%"
    />
  );
};

const labelWidths = [8, 6, 10, 5, 4, 7, 9, 6, 5, 4, 6, 4, 5, 4, 8] as const;

export const StatsListSkeleton = () => (
  <BarListSkeleton labelWidths={labelWidths} valueWidth={6} />
);
