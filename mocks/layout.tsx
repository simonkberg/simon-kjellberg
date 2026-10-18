import type { PropsWithChildren } from "react";

export const Layout = ({ children }: PropsWithChildren) => (
  <div data-testid="layout">{children}</div>
);
