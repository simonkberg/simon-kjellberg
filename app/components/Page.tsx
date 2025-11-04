import { Header } from "@/components/Header";
import type { PropsWithChildren } from "react";

interface PageProps extends PropsWithChildren {
  title: string;
}

export const Page = ({ title, children }: PageProps) => (
  <div className="page">
    <Header title={title} />
    <div className="content">{children}</div>
  </div>
);
