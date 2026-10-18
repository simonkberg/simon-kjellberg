import { useSyncExternalStore } from "react";

import { SKIN_TONES } from "@/lib/emoji";

type SkinTone = (typeof SKIN_TONES)[number];

const KEY = "skin-tone";
const listeners = new Set<() => void>();

// Once storage fails to save a pick, the pick still sticks for the visit.
let unsaved: SkinTone | undefined;

function read(): SkinTone {
  if (unsaved) return unsaved;
  try {
    return SKIN_TONES[Number(localStorage.getItem(KEY))] ?? SKIN_TONES[0];
  } catch {
    return SKIN_TONES[0];
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

/** The visitor's skin tone, one of SKIN_TONES. */
export const useSkinTone = () =>
  useSyncExternalStore(subscribe, read, () => SKIN_TONES[0]);

export function setSkinTone(tone: SkinTone) {
  try {
    localStorage.setItem(KEY, String(SKIN_TONES.indexOf(tone)));
    unsaved = undefined;
  } catch {
    unsaved = tone;
  }
  for (const listener of listeners) listener();
}
