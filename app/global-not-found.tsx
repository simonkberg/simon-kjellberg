import type { Metadata } from "next";

import { Heading } from "@/components/Heading";
import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { config } from "@/config";

const title = `${config.title} - Not Found`;
const description = "The page you are looking for does not exist.";

export const metadata: Metadata = { title, description };

export default function GlobalNotFound() {
  return (
    <Layout>
      <Page title={title}>
        <section>
          <Heading level={2}>Page not found!</Heading>
          <p>{description}</p>
        </section>
      </Page>
    </Layout>
  );
}
