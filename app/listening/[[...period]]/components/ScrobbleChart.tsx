import { type CSSProperties, use } from "react";

import type { ScrobbleCount } from "@/actions/lastfm";
import { SkeletonStatus } from "@/components/Skeleton";
import { TooltipText } from "@/components/Tooltip";
import type { Period } from "@/lib/lastfm";
import { bucketCounts } from "@/lib/scrobbleBuckets";

export interface ScrobbleChartProps {
  // Undefined when the counts failed to load.
  scrobbles: Promise<readonly ScrobbleCount[] | undefined>;
}

export const ScrobbleChart = ({ scrobbles }: ScrobbleChartProps) => {
  const items = use(scrobbles);

  if (items === undefined) {
    return <p>Scrobbles are temporarily unavailable :(</p>;
  }

  // All-zero counts would make the columns' `--value / --max` a 0/0.
  const max = Math.max(0, ...items.map(({ count }) => count)) || 1;

  return (
    <figure className="columns" style={{ "--max": max } as CSSProperties}>
      <span className="peak" aria-hidden="true">
        {max}
      </span>
      <ol>
        {items.map(({ label, count }) => (
          <li key={label} style={{ "--value": count } as CSSProperties}>
            <TooltipText tooltip={`${label}: ${count}`}>
              <span className="visually-hidden">
                {label}: {count}
              </span>
            </TooltipText>
          </li>
        ))}
      </ol>
      <span className="axis" aria-hidden="true">
        <span>{items.at(0)?.label}</span>
        <span>{items.at(-1)?.label}</span>
      </span>
    </figure>
  );
};

// All time has a column per year, unknown until it loads.
const skeletonColumns = (period: Period) =>
  period === "overall" ? 10 : bucketCounts[period];

export const ScrobbleChartSkeleton = ({ period }: { period: Period }) => (
  <SkeletonStatus>
    <figure className="columns placeholder" aria-hidden="true">
      <span className="peak" />
      <ol>
        {Array.from({ length: skeletonColumns(period) }, (_, index) => (
          <li key={index} />
        ))}
      </ol>
      <span className="axis" />
    </figure>
  </SkeletonStatus>
);
