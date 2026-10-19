import { useSyncExternalStore } from "react";

import { SKIN_TONES, type SkinTone } from "@/lib/emoji";

const KEY = "skin-tone";
const listeners = new Set<() => void>();
let current: SkinTone | undefined;

function load(): SkinTone {
  try {
    return SKIN_TONES[Number(localStorage.getItem(KEY))] ?? SKIN_TONES[0];
  } catch {
    return SKIN_TONES[0];
  }
}

const read = () => (current ??= load());

function notify() {
  for (const listener of listeners) listener();
}

function onStorage() {
  current = undefined;
  notify();
}

function subscribe(onChange: () => void) {
  // Kept after the last unsubscribe, so a closed picker still hears other tabs; adding it again is a no-op.
  window.addEventListener("storage", onStorage);
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** The visitor's skin tone, for handlers that only read it. */
export const getSkinTone = read;

/** The visitor's skin tone, one of SKIN_TONES. */
export const useSkinTone = () =>
  useSyncExternalStore(subscribe, read, () => SKIN_TONES[0]);

export function setSkinTone(tone: SkinTone) {
  current = tone;
  try {
    localStorage.setItem(KEY, String(SKIN_TONES.indexOf(tone)));
  } catch {
    // Kept in memory anyway, so the pick still holds for the visit.
  }
  notify();
}
