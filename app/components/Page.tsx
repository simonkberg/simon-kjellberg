import type { PropsWithChildren } from "react";

import { Header } from "@/components/Header";

interface PageProps extends PropsWithChildren {
  section?: string;
}

export const Page = ({ section, children }: PageProps) => (
  <div className="page">
    <Header section={section} />
    <div className="content">{children}</div>
  </div>
);
