import type { Metadata } from "next";

import { getTopAlbums, getTopArtists, getTopTracks } from "@/actions/lastfm";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Subtitle } from "@/components/Subtitle";
import { TopAlbumsTable } from "@/components/TopAlbumsTable";
import { TopArtistsTable } from "@/components/TopArtistsTable";
import { TopTracksTable } from "@/components/TopTracksTable";
import { isValidPeriod, type Period } from "@/lib/lastfm";

export const metadata: Metadata = {
  title: "Listening | simon.dev",
  description: "My listening statistics from Last.fm",
};

interface ListeningPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListeningPage({
  searchParams,
}: ListeningPageProps) {
  const params = await searchParams;
  const periodParam = params["period"];
  const period: Period =
    typeof periodParam === "string" && isValidPeriod(periodParam)
      ? periodParam
      : "overall";

  const [tracksResult, artistsResult, albumsResult] = await Promise.all([
    getTopTracks(period),
    getTopArtists(period),
    getTopAlbums(period),
  ]);

  return (
    <Page title="Listening">
      <section>
        <p>
          My listening statistics from{" "}
          <ExternalLink href="https://www.last.fm/user/magijo">
            Last.fm
          </ExternalLink>
          .
        </p>
        <PeriodSelector current={period} />
      </section>

      <section>
        <Heading level={2}>
          Top Tracks <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopTracksTable result={tracksResult} />
      </section>

      <section>
        <Heading level={2}>
          Top Artists <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopArtistsTable result={artistsResult} />
      </section>

      <section>
        <Heading level={2}>
          Top Albums <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopAlbumsTable result={albumsResult} />
      </section>
    </Page>
  );
}
