import { useSyncExternalStore } from "react";

import { SKIN_TONES } from "@/lib/emoji";

const KEY = "skin-tone";
const listeners = new Set<() => void>();

// Where storage throws, the tone still sticks for the visit.
let unsaved = 0;

function read(): number {
  try {
    const tone = Number(localStorage.getItem(KEY));
    return Number.isInteger(tone) && tone in SKIN_TONES ? tone : 0;
  } catch {
    return unsaved;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab's pick.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's tone, an index into SKIN_TONES. */
export const useSkinTone = () => useSyncExternalStore(subscribe, read, () => 0);

export function setSkinTone(tone: number) {
  try {
    localStorage.setItem(KEY, String(tone));
  } catch {
    unsaved = tone;
  }
  for (const listener of listeners) listener();
}
