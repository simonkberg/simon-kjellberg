import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, use } from "react";

import {
  getTopAlbums,
  type GetTopAlbumsResult,
  getTopArtists,
  type GetTopArtistsResult,
  getTopTracks,
  type GetTopTracksResult,
  type TopAlbum,
  type TopArtist,
  type TopTrack,
} from "@/actions/lastfm";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";
import { Subtitle } from "@/components/Subtitle";
import {
  isValidPeriod,
  type Period,
  periodLabels,
  periods,
} from "@/lib/lastfm";

import { PeriodSelector } from "./components/PeriodSelector";
import {
  TopTable,
  type TopTableColumn,
  TopTableSkeleton,
} from "./components/TopTable";

export const prefetch = "partial";
// Reading params behind Suspense would turn invalid periods into soft 404s.
export const instant = false;

const trackColumns: TopTableColumn<TopTrack>[] = [
  { label: "Track", key: "name" },
  { label: "Artist", key: "artist" },
];
const artistColumns: TopTableColumn<TopArtist>[] = [
  { label: "Artist", key: "name" },
];
const albumColumns: TopTableColumn<TopAlbum>[] = [
  { label: "Album", key: "name" },
  { label: "Artist", key: "artist" },
];

const trackRows = (result: GetTopTracksResult) =>
  result.status === "ok" ? result.tracks : undefined;
const artistRows = (result: GetTopArtistsResult) =>
  result.status === "ok" ? result.artists : undefined;
const albumRows = (result: GetTopAlbumsResult) =>
  result.status === "ok" ? result.albums : undefined;

type ListeningPageProps = PageProps<"/listening/[[...period]]">;

const toPeriod = (param?: string[]): Period => {
  if (param === undefined) return "overall";

  const [period, ...rest] = param;
  if (rest.length === 0 && isValidPeriod(period)) {
    return period;
  }

  notFound();
};

export async function generateMetadata({
  params,
}: ListeningPageProps): Promise<Metadata> {
  const period = toPeriod((await params).period);
  const periodLabel = periodLabels[period];

  return {
    title: `Listening - ${periodLabel}`,
    description: `My ${periodLabel} listening statistics from Last.fm`,
  };
}

export function generateStaticParams(): Awaited<
  ListeningPageProps["params"]
>[] {
  return periods.map((period) => ({
    period: period === "overall" ? undefined : [period],
  }));
}

export default function ListeningPage({ params }: ListeningPageProps) {
  const period = toPeriod(use(params).period);
  const topTracks = getTopTracks(period);
  const topArtists = getTopArtists(period);
  const topAlbums = getTopAlbums(period);

  return (
    <Page section="Listening">
      <section>
        <p>
          My {periodLabels[period]} listening statistics from{" "}
          <ExternalLink href="https://www.last.fm/user/magijo">
            Last.fm
          </ExternalLink>
          .
        </p>
      </section>

      <PeriodSelector current={period} />

      <section>
        <Heading level={2}>
          Top Tracks <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <Suspense fallback={<TopTableSkeleton columns={trackColumns} />}>
          <TopTable
            result={topTracks}
            rows={trackRows}
            noun="tracks"
            columns={trackColumns}
          />
        </Suspense>
      </section>

      <section>
        <Heading level={2}>
          Top Artists <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <Suspense fallback={<TopTableSkeleton columns={artistColumns} />}>
          <TopTable
            result={topArtists}
            rows={artistRows}
            noun="artists"
            columns={artistColumns}
          />
        </Suspense>
      </section>

      <section>
        <Heading level={2}>
          Top Albums <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <Suspense fallback={<TopTableSkeleton columns={albumColumns} />}>
          <TopTable
            result={topAlbums}
            rows={albumRows}
            noun="albums"
            columns={albumColumns}
          />
        </Suspense>
      </section>
    </Page>
  );
}
