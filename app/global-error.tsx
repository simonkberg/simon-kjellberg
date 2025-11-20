"use client";

import type { Metadata } from "next";

import { Heading } from "@/components/Heading";
import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { config } from "@/config";

const title = `${config.title} - Error`;
const description = "Something went wrong!";

export const metadata: Metadata = { title, description };

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <Layout>
      <Page title={title}>
        <section>
          <Heading level={2}>{description}</Heading>
          <p className="subtitle">{error.message}</p>
          <button className="link" onClick={() => reset()}>
            Try again
          </button>
        </section>
      </Page>
    </Layout>
  );
}
