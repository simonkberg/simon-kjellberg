import type { Period } from "@/lib/lastfm";

const periodLabels: Record<Period, string> = {
  "7day": "7 days",
  "1month": "1 month",
  "3month": "3 months",
  "6month": "6 months",
  "12month": "1 year",
  overall: "all time",
};

const periodOrder: Period[] = [
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
  "overall",
];

export interface PeriodSelectorProps {
  current: Period;
}

export const PeriodSelector = ({ current }: PeriodSelectorProps) => (
  <p>
    {periodOrder.map((period, index) => (
      <span key={period}>
        {index > 0 && " | "}
        {period === current ? (
          <span>{periodLabels[period]}</span>
        ) : (
          <a href={`/listening?period=${period}`}>{periodLabels[period]}</a>
        )}
      </span>
    ))}
  </p>
);
