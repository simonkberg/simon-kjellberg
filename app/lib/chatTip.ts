import "server-only";
import { cookies } from "next/headers";

import { CHAT_TIP_COOKIE } from "./chatTipCookie";

/**
 * Whether the "mention simon bot" tip has been dismissed, either by sending a
 * message or by clicking it away.
 */
export async function getChatTipDismissed() {
  const cookieJar = await cookies();

  return cookieJar.get(CHAT_TIP_COOKIE)?.value === "true";
}

/** Dismisses the tip, leaving an already-dismissed cookie untouched. */
export async function setChatTipDismissed() {
  if (await getChatTipDismissed()) {
    return;
  }

  const cookieJar = await cookies();

  cookieJar.set(CHAT_TIP_COOKIE, "true");
}
