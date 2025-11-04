"use client";

import { Heading } from "@/components/Heading";
import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { config } from "@/config";
import "@/global.css";
import type { Metadata } from "next";

const title = `${config.title} - Error`;

export const metadata: Metadata = {
  title: title,
  description: "Something went wrong!",
};

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <Layout>
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
