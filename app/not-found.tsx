import type { Metadata } from "next";

import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";

const description = "The page you are looking for does not exist.";

export const metadata: Metadata = {
  title: "Not Found",
  description,
  // Otherwise the layout's canonical resolves against the internal /_not-found route.
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <Page section="Not Found">
      <section>
        <Heading level={2}>Page not found!</Heading>
        <p>{description}</p>
      </section>
    </Page>
  );
}
