"use client";

import { animated, useSprings } from "@react-spring/web";
import { type CSSProperties, use, useState } from "react";

import type { ScrobbleCount } from "@/actions/lastfm";
import { SkeletonStatus } from "@/components/Skeleton";
import { TooltipText } from "@/components/Tooltip";
import { useMotion } from "@/components/useMotion";

export interface ScrobbleChartProps {
  // Undefined when the counts failed to load.
  scrobbles: Promise<readonly ScrobbleCount[] | undefined>;
}

// Labels count back from the current bucket. Narrow charts show every other one.
const labelStep = (count: number) => (count <= 8 ? 1 : Math.ceil(count / 6));

const labelTick = (fromEnd: number, step: number) => {
  if (fromEnd % (step * 2) === 0) return "narrow";
  if (fromEnd % step === 0) return "wide";
  return undefined;
};

const Stems = ({ items }: { items: readonly ScrobbleCount[] }) => {
  const animate = useMotion();
  const [from] = useState(animate ? 0 : 1);
  const [springs] = useSprings(items.length, (index) => ({
    from: { grow: from },
    to: { grow: 1 },
    delay: index * 15,
  }));

  const counts = items.map(({ count }) => count);
  // All-zero counts would make the stems' `--value / --max` a 0/0.
  const max = Math.max(0, ...counts) || 1;
  const peak = counts.indexOf(max);
  // The current bucket is still filling up, so it would drag the average down.
  const settled = items.filter(({ current }) => !current);
  const average =
    settled.length > 0
      ? Math.round(
          settled.reduce((sum, { count }) => sum + count, 0) / settled.length,
        )
      : undefined;
  const step = labelStep(items.length);

  return (
    <figure
      className="stems"
      style={
        {
          "--max": max,
          "--average": average,
          "--count": items.length,
        } as CSSProperties
      }
    >
      <ol>
        {items.map(({ label, count, current }, index) => {
          const text = `${label}: ${count}${current ? " so far" : ""}`;
          const tick = labelTick(items.length - 1 - index, step);
          return (
            <animated.li
              key={label}
              style={
                {
                  "--value": count,
                  "--grow": springs[index]?.grow,
                } as CSSProperties
              }
              data-current={current || undefined}
              data-tick={tick}
            >
              {/* A chart is pointed at on purpose, unlike text read past. */}
              <TooltipText tooltip={text} delay={0}>
                <span className="stem">
                  <span className="visually-hidden">{text}</span>
                </span>
              </TooltipText>
              {index === peak && (
                <span className="peak" aria-hidden="true">
                  {count}
                </span>
              )}
              {tick && (
                <span className="tick" aria-hidden="true">
                  {label}
                </span>
              )}
            </animated.li>
          );
        })}
      </ol>
      {average !== undefined && (
        <span className="average" aria-hidden="true">
          <span>
            {average}
            <span> avg</span>
          </span>
        </span>
      )}
    </figure>
  );
};

export const ScrobbleChart = ({ scrobbles }: ScrobbleChartProps) => {
  const items = use(scrobbles);

  if (items === undefined) {
    return <p>Scrobbles are temporarily unavailable :(</p>;
  }

  return <Stems items={items} />;
};

export const ScrobbleChartSkeleton = () => (
  <SkeletonStatus>
    <figure className="stems" aria-hidden="true">
      <ol />
    </figure>
  </SkeletonStatus>
);
