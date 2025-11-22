import type { Metadata } from "next";
import { type ReactNode } from "react";

import { Layout } from "@/components/Layout";
import { config } from "@/config";

export const metadata: Metadata = {
  title: { default: config.title, template: `%s - ${config.title}` },
  description: config.description,
  openGraph: {
    type: "website",
    url: config.url,
    title: config.title,
    description: config.description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
