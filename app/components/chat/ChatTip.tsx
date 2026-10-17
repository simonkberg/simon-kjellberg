"use client";

import { startTransition } from "react";

import { dismissChatTip } from "@/actions/chat";
import { TooltipButton } from "@/components/Tooltip";

export const ChatTip = () => (
  <p className="chat-tip">
    {/* U+24D8 CIRCLED LATIN SMALL LETTER I. Iosevka covers this one;
        U+1F6C8, the obvious pick, is not in the font and would fall back. */}
    <span aria-hidden="true">&#x24D8;</span> mention &ldquo;simon bot&rdquo; to
    chat with a clanker.{" "}
    <TooltipButton
      tooltip="Dismiss tip"
      // Without this it submits the chat form it sits inside.
      type="button"
      className="clear"
      onClick={() => startTransition(dismissChatTip)}
    >
      &times;
    </TooltipButton>
  </p>
);
