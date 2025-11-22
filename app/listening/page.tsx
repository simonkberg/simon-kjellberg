import type { Metadata } from "next";
import { Suspense } from "react";

import { getTopAlbums, getTopArtists, getTopTracks } from "@/actions/lastfm";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { Page } from "@/components/Page";
import { Subtitle } from "@/components/Subtitle";
import { isValidPeriod } from "@/lib/lastfm";

import { PeriodSelector } from "./components/PeriodSelector";
import { TopAlbumsTable } from "./components/TopAlbumsTable";
import { TopArtistsTable } from "./components/TopArtistsTable";
import { TopTracksTable } from "./components/TopTracksTable";

export const metadata: Metadata = {
  title: "Listening | simon.dev",
  description: "My listening statistics from Last.fm",
};

export default function ListeningPage({
  searchParams,
}: PageProps<"/listening">) {
  const period = searchParams.then((params) =>
    isValidPeriod(params["period"]) ? params["period"] : "overall",
  );

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
      </section>

      <PeriodSelector current={period} />

      <Suspense fallback={<Loader />}>
        <section>
          <Heading level={2}>
            Top Tracks <Subtitle>(Top 10)</Subtitle>
          </Heading>
          <TopTracksTable topTracks={period.then(getTopTracks)} />
        </section>

        <section>
          <Heading level={2}>
            Top Artists <Subtitle>(Top 10)</Subtitle>
          </Heading>
          <TopArtistsTable topArtists={period.then(getTopArtists)} />
        </section>

        <section>
          <Heading level={2}>
            Top Albums <Subtitle>(Top 10)</Subtitle>
          </Heading>
          <TopAlbumsTable topAlbums={period.then(getTopAlbums)} />
        </section>
      </Suspense>
    </Page>
  );
}
