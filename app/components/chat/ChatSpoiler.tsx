"use client";

import { type ReactNode, useState } from "react";

/** Discord's `||spoiler||`: hidden until clicked, then shown for good. */
export const ChatSpoiler = ({ children }: { children: ReactNode }) => {
  const [revealed, setRevealed] = useState(false);

  if (revealed) return <span className="spoiler">{children}</span>;

  return (
    // A `<button>` can't hold the links a spoiler may, nor wrap across lines like text.
    <span
      className="spoiler"
      role="button"
      tabIndex={0}
      aria-label="Spoiler"
      onClick={() => setRevealed(true)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setRevealed(true);
      }}
    >
      <span inert>{children}</span>
    </span>
  );
};
