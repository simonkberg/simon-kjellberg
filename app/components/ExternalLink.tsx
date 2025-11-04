import Link from "next/link";
import type { ComponentProps } from "react";

export const ExternalLink = (props: ComponentProps<typeof Link>) => (
  <Link target="_blank" rel="noopener noreferrer" {...props} />
);
