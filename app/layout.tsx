import { type ReactNode } from "react";

import { Layout } from "@/components/Layout";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
