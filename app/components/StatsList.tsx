"use client";

import { animated, useSprings } from "@react-spring/web";
import { use } from "react";

import type { WakaTimeStatsResult } from "@/actions/wakaTime";
import type { WakaTimeStats } from "@/lib/wakaTime";

interface StatsListItemsProps {
  stats: WakaTimeStats;
}

const StatsListItems = ({ stats }: StatsListItemsProps) => {
  const springs = useSprings(
    stats.length,
    stats.map((stat) => ({
      from: { percent: 0 },
      to: { percent: stat.percent },
    })),
  );

  return (
    <>
      {springs.map((stat, index) => {
        const { name } = stats[index]!;
        return (
          <li key={name}>
            {name}:{" "}
            <animated.span>
              {stat.percent.to((val) => val.toFixed(2))}
            </animated.span>
            %
          </li>
        );
      })}
    </>
  );
};

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
    <ul>
      <StatsListItems stats={result.stats} />
    </ul>
  );
};
