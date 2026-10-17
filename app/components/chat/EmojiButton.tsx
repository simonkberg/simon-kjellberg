import type { ComponentProps } from "react";

import { TooltipButton } from "@/components/Tooltip";

/** An emoji in a picker, its shortcode shown above the whole picker so it never covers the emoji around it. */
export const EmojiButton = ({
  emoji,
  name,
  picker,
  ...props
}: Omit<ComponentProps<typeof TooltipButton>, "tooltip" | "anchor"> & {
  emoji: string;
  name: string;
  picker: string;
}) => (
  <TooltipButton
    tooltip={`:${name}:`}
    anchor={picker}
    aria-label={name}
    {...props}
  >
    {emoji}
  </TooltipButton>
);
