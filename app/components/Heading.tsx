import type { PropsWithChildren } from "react";

export interface HeadingProps extends PropsWithChildren {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading = ({ level, children }: HeadingProps) => {
  const Component = `h${level}` as const;

  return <Component className="heading">{children}</Component>;
};
