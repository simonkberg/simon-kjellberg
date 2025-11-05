import { getChatHistory } from "@/actions/chat";
import { getWakaTimeStats } from "@/actions/wakaTime";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatInput } from "@/components/ChatInput";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { Page } from "@/components/Page";
import { StatsList } from "@/components/StatsList";
import { Subtitle } from "@/components/Subtitle";
import { Terminal } from "@/components/Terminal";
import { config } from "@/config";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    type: "website",
    url: config.url,
    title: config.title,
    description: config.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "black",
};

export default async function RootPage() {
  const stats = getWakaTimeStats();
  const history = getChatHistory();

  return (
    <Page title={config.title}>
      <section>
        <Heading level={2}>
          About <Subtitle>(Location: Stockholm, Sweden)</Subtitle>
        </Heading>
        <p>{config.description}</p>
        <p>
          Working as a senior engineer at{" "}
          <ExternalLink href="https://twitter.com/SpotifyEng">
            Spotify
          </ExternalLink>
          .
        </p>
      </section>

      <section>
        <Heading level={2}>
          Currently writing{" "}
          <Subtitle>
            (Via{" "}
            <ExternalLink href="https://wakatime.com/@simonkberg">
              WakaTime
            </ExternalLink>
            )
          </Subtitle>
        </Heading>
        <Suspense fallback={<Loader />}>
          <StatsList stats={stats} />
        </Suspense>
      </section>

      <section>
        <Heading level={2}>Links</Heading>
        <ul>
          {config.links.map((link) => (
            <li key={link.url}>
              <ExternalLink href={link.url}>{link.label}</ExternalLink>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Heading level={2}>Slack</Heading>
        <Terminal>
          <Suspense fallback={<Loader />}>
            <ChatHistory history={history} />
            <ChatInput />
          </Suspense>
        </Terminal>
      </section>
    </Page>
  );
}
