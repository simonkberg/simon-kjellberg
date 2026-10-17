import { use } from "react";

import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

interface Ranked {
  rank: number;
  name: string;
  playcount: number;
}

type TextKey<Row> = {
  [K in keyof Row]: Row[K] extends string ? K : never;
}[keyof Row];

interface Labelled {
  label: string;
}

export interface TopTableColumn<Row> extends Labelled {
  key: TextKey<Row>;
}

export interface TopTableProps<Row extends Ranked> {
  // Undefined when the list failed to load.
  rows: Promise<readonly Row[] | undefined>;
  noun: string;
  columns: readonly TopTableColumn<Row>[];
}

const textWidths = [
  [16, 11],
  [10, 14],
  [21, 8],
  [13, 12],
  [8, 16],
  [18, 10],
  [12, 7],
  [15, 13],
  [9, 11],
  [19, 9],
] as const;

const Head = ({ columns }: { columns: readonly Labelled[] }) => (
  <>
    <colgroup>
      <col />
      {columns.map(({ label }) => (
        <col key={label} style={{ width: `${100 / columns.length}%` }} />
      ))}
      <col />
    </colgroup>
    <thead>
      <tr>
        <th className="numeric">#</th>
        {columns.map(({ label }) => (
          <th key={label}>{label}</th>
        ))}
        <th className="numeric">Plays</th>
      </tr>
    </thead>
  </>
);

export const TopTable = <Row extends Ranked>({
  rows,
  noun,
  columns,
}: TopTableProps<Row>) => {
  const result = use(rows);

  if (result === undefined) {
    return <p>Top {noun} are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <Head columns={columns} />
      <tbody>
        {result.map((row) => (
          <tr key={`${row.rank}-${row.name}`}>
            <td className="numeric">{row.rank}</td>
            {columns.map((column) => (
              <td key={column.label}>{String(row[column.key])}</td>
            ))}
            <td className="numeric">
              <AnimatedNumber value={row.playcount} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const TopTableSkeleton = ({
  columns,
}: {
  columns: readonly Labelled[];
}) => (
  <SkeletonStatus>
    <table className="placeholder" aria-hidden="true">
      <Head columns={columns} />
      <tbody>
        {textWidths.map((widths, index) => (
          <tr key={index}>
            <td className="numeric">{index + 1}</td>
            {widths.slice(0, columns.length).map((width, column) => (
              <td key={column}>
                <Skeleton width={width} />
              </td>
            ))}
            <td className="numeric">
              <Skeleton width={4} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </SkeletonStatus>
);
