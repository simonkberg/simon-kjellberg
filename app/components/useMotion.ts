import { useSyncExternalStore } from "react";

const reducedMotion = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = matchMedia(reducedMotion);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether to animate: false with reduced motion, and while hydrating, since the server markup already shows the end state. */
export const useMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => !matchMedia(reducedMotion).matches,
    () => false,
  );
