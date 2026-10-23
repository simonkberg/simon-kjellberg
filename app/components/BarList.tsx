import type { CSSProperties } from "react";

import { AnimatedNumber } from "./AnimatedNumber";
import { Skeleton, SkeletonStatus } from "./Skeleton";

export interface Bar {
  label: string;
  value: number;
}

export interface BarListProps {
  bars: readonly Bar[];
  decimals?: number;
  unit?: string;
}

export const BarList = ({ bars, decimals, unit }: BarListProps) => {
  // All-zero values would make the bars' `--value / --max` a 0/0.
  const max = Math.max(...bars.map((bar) => bar.value)) || 1;

  return (
    <ul className="stats" style={{ "--max": max } as CSSProperties}>
      {bars.map((bar) => (
        <li key={bar.label} style={{ "--value": bar.value } as CSSProperties}>
          <span className="label">{bar.label}</span>{" "}
          <span className="value">
            <AnimatedNumber value={bar.value} decimals={decimals} />
            {unit}
          </span>
        </li>
      ))}
    </ul>
  );
};

export interface BarListSkeletonProps {
  labelWidths: readonly number[];
  valueWidth: number;
}

export const BarListSkeleton = ({
  labelWidths,
  valueWidth,
}: BarListSkeletonProps) => (
  <SkeletonStatus>
    <ul className="stats placeholder" aria-hidden="true">
      {labelWidths.map((width, index) => (
        <li key={index}>
          <span className="label">
            <Skeleton width={width} />
          </span>{" "}
          <span className="value">
            <Skeleton width={valueWidth} />
          </span>
        </li>
      ))}
    </ul>
  </SkeletonStatus>
);
