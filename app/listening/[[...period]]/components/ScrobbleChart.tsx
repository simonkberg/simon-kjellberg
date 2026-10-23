import { use } from "react";

import type { ScrobbleCount } from "@/actions/lastfm";
import { BarList, BarListSkeleton } from "@/components/BarList";
import type { Period } from "@/lib/lastfm";
import { bucketCounts, bucketUnits } from "@/lib/scrobbleBuckets";

export interface ScrobbleChartProps {
  // Undefined when the counts failed to load.
  scrobbles: Promise<readonly ScrobbleCount[] | undefined>;
}

export const ScrobbleChart = ({ scrobbles }: ScrobbleChartProps) => {
  const items = use(scrobbles);

  if (items === undefined) {
    return <p>Scrobbles are temporarily unavailable :(</p>;
  }

  return (
    <BarList
      bars={items.map(({ label, count }) => ({ label, value: count }))}
    />
  );
};

const labelWidths = { day: 6, month: 8, year: 4 } as const;

export const ScrobbleChartSkeleton = ({ period }: { period: Period }) => (
  <BarListSkeleton
    labelWidths={Array.from(
      { length: period === "overall" ? 10 : bucketCounts[period] },
      () => labelWidths[bucketUnits[period]],
    )}
    valueWidth={4}
  />
);
