import Link from "next/link";
import { Suspense, use } from "react";
import { objectEntries } from "ts-extras";

import type { Period } from "@/lib/lastfm";

const periodsWithLabels = objectEntries({
  "7day": "7 days",
  "1month": "1 month",
  "3month": "3 months",
  "6month": "6 months",
  "12month": "1 year",
  overall: "all time",
} as const satisfies Record<Period, string>);

const DisabledLink = ({ children }: { children: string }) => (
  <a role="link" aria-disabled="true" tabIndex={-1}>
    {children}
  </a>
);

const PeriodLink = ({
  period,
  current,
  children,
}: {
  period: Period;
  current: Promise<Period>;
  children: string;
}) =>
  use(current) === period ? (
    children
  ) : (
    <Link href={`?period=${period}`} replace>
      {children}
    </Link>
  );

export interface PeriodSelectorProps {
  current: Promise<Period>;
}

export const PeriodSelector = ({ current }: PeriodSelectorProps) => (
  <menu>
    {periodsWithLabels.map(([period, label]) => (
      <li key={period}>
        <Suspense fallback={<DisabledLink>{label}</DisabledLink>}>
          <PeriodLink period={period} current={current}>
            {label}
          </PeriodLink>
        </Suspense>
      </li>
    ))}
  </menu>
);
