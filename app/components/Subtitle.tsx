import type { PropsWithChildren } from "react";

export const Subtitle = ({ children }: PropsWithChildren) => (
  <small className={"subtitle"}>{children}</small>
);
