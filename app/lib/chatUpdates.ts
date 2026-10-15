import "server-only";
import { listen, type ReactionClear } from "@/lib/discord/gateway";
import { getGlobal } from "@/lib/global";
import { log } from "@/lib/log";

// Discord's gateway echoes the bot's own reactions back well within this.
const ECHO_TIMEOUT_MS = 3000;

function getState() {
  return getGlobal("simon.dev/chat-updates", () => ({
    subscribers: new Set<() => void>(),
    refreshes: 0,
  }));
}

/** Calls `callback` whenever this replica's chat changes. */
export function onChatRefresh(callback: () => void): () => void {
  const { subscribers } = getState();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/** Tells this replica's chat streams to re-read the chat. */
export function refreshChat(): void {
  const state = getState();
  state.refreshes++;
  for (const callback of state.subscribers) {
    try {
      callback();
    } catch (err) {
      log.error({ err }, "Chat refresh subscriber error");
    }
  }
}

/** For a change Discord should echo back: refreshes anyway if nothing else does soon. Armed before the change, since the echo can beat Discord's response; returns a cancel for a change that failed. */
export function refreshChatUnlessEchoed(): () => void {
  const state = getState();
  const before = state.refreshes;
  const timer = setTimeout(() => {
    if (state.refreshes === before) refreshChat();
  }, ECHO_TIMEOUT_MS).unref();
  return () => clearTimeout(timer);
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
    void applyClear(clear)
      .catch((err: unknown) => {
        log.error({ err, ...clear }, "Failed to clear reactions");
      })
      .then(refreshChat);
  });
}
