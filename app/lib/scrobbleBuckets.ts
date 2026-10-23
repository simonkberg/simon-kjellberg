import type { Period } from "@/lib/lastfm";

export interface ScrobbleBucket {
  label: string;
  from: Date;
  to: Date;
}

const timeZone = "Europe/Stockholm";

// sv-SE formats as "2026-10-23 09:15:00", which parses as ISO once given a T and a Z.
const wallClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone,
  dateStyle: "short",
  timeStyle: "medium",
});

const localTime = (instant: number) =>
  Date.parse(`${wallClock.format(instant).replace(" ", "T")}Z`);

// Date.UTC normalizes overflowing days and months, so callers can step by subtracting.
function midnight(year: number, month: number, day: number): Date {
  const utc = Date.UTC(year, month, day);
  const guess = utc - (localTime(utc) - utc);
  return new Date(utc - (localTime(guess) - guess));
}

const labels = {
  day: new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  }),
  month: new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    year: "numeric",
  }),
  year: new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }),
};

export type BucketUnit = keyof typeof labels;

export const bucketUnits = {
  "7day": "day",
  "1month": "day",
  "3month": "month",
  "6month": "month",
  "12month": "month",
  overall: "year",
} as const satisfies Record<Period, BucketUnit>;

export const bucketCounts = {
  "7day": 7,
  "1month": 30,
  "3month": 3,
  "6month": 6,
  "12month": 12,
} as const satisfies Record<Exclude<Period, "overall">, number>;

function start(unit: BucketUnit, today: Date, offset: number): Date {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  switch (unit) {
    case "day":
      return midnight(year, month, day - offset);
    case "month":
      return midnight(year, month - offset, 1);
    case "year":
      return midnight(year - offset, 0, 1);
  }
}

function buckets(
  unit: BucketUnit,
  count: number,
  today: Date,
): ScrobbleBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const from = start(unit, today, offset);
    return {
      label: labels[unit].format(from),
      from,
      to: start(unit, today, offset - 1),
    };
  });
}

const localDate = (instant: Date) => new Date(localTime(instant.getTime()));

/** Calendar days or months in Stockholm, oldest first, ending with the current one. */
export function scrobbleBuckets(
  period: Exclude<Period, "overall">,
  now: Date,
): ScrobbleBucket[] {
  return buckets(bucketUnits[period], bucketCounts[period], localDate(now));
}

/** Calendar years in Stockholm, from the one `since` falls in to the current one. */
export function yearBuckets(since: Date, now: Date): ScrobbleBucket[] {
  const today = localDate(now);
  const count = today.getUTCFullYear() - localDate(since).getUTCFullYear() + 1;
  return buckets("year", count, today);
}
