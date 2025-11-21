"use client";

import { Heading } from "@/components/Heading";
import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { config } from "@/config";

const title = `${config.title} - Error`;

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <Layout>
      <title>{title}</title>
      <Page title={title}>
        <section>
          <Heading level={2}>Something went wrong!</Heading>
          <p className="subtitle">{error.message}</p>
          <button className="link" onClick={() => reset()}>
            Try again
          </button>
        </section>
      </Page>
    </Layout>
  );
}
