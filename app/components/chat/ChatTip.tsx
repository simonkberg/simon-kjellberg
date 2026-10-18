"use client";

import { startTransition, useSyncExternalStore } from "react";

import { dismissChatTip } from "@/actions/chat";
import { TooltipButton } from "@/components/Tooltip";
import { CHAT_TIP_COOKIE } from "@/lib/chatTipCookie";

// A restored or backgrounded page keeps the tip it rendered with, so the cookie is read again on return.
function subscribe(onChange: () => void) {
  window.addEventListener("pageshow", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("pageshow", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const readCookie = () =>
  document.cookie.split("; ").includes(`${CHAT_TIP_COOKIE}=true`);

/** The server's answer until hydration, then the browser's cookie. */
export const useChatTipDismissed = (serverDismissed: boolean) =>
  useSyncExternalStore(subscribe, readCookie, () => serverDismissed);

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
