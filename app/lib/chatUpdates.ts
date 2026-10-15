import "server-only";
import { listen, type ReactionClear } from "@/lib/discord/gateway";
import { getGlobal } from "@/lib/global";
import { log } from "@/lib/log";

function getSubscribers() {
  return getGlobal("simon.dev/chat-updates", () => new Set<() => void>());
}

/** Calls `callback` whenever this replica's chat changes. */
export function onChatRefresh(callback: () => void): () => void {
  const subscribers = getSubscribers();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/** Tells this replica's chat streams to re-read the chat. */
export function refreshChat(): void {
  for (const callback of getSubscribers()) {
    try {
      callback();
    } catch (err) {
      log.error({ err }, "Chat refresh subscriber error");
    }
  }
}

/** Refreshes the chat on every change in the channel; a deletion or reaction clear only once `applyClear` has dropped what it took, so no stream reads those rows. */
export function startChatUpdates(
  applyClear: (clear: ReactionClear) => Promise<void>,
): () => void {
  return listen(({ clear }) => {
    if (!clear) {
      refreshChat();
      return;
    }
    void Promise.try(() => applyClear(clear))
      .catch((err: unknown) => {
        log.error({ err, ...clear }, "Failed to clear reactions");
      })
      .then(refreshChat);
  });
}
