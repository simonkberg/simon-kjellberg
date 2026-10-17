import type { KeyboardEvent } from "react";

function targetIndex(
  key: string,
  current: number,
  last: number,
  columns: number | undefined,
): number | undefined {
  switch (key) {
    case "ArrowUp":
      return current - (columns ?? 1);
    case "ArrowDown":
      return current + (columns ?? 1);
    case "ArrowLeft":
      return columns === undefined ? undefined : current - 1;
    case "ArrowRight":
      return columns === undefined ? undefined : current + 1;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return undefined;
  }
}

/** Moves focus between `elements` with the arrow keys, Home and End: up and down a list, or across a grid of `columns`. */
export function arrowFocus(
  event: KeyboardEvent,
  elements: HTMLElement[],
  columns?: number,
) {
  // Leaves shortcuts like Cmd+ArrowDown to the browser.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const current = elements.findIndex((element) => element === event.target);
  if (current === -1) return;
  const index = targetIndex(event.key, current, elements.length - 1, columns);
  if (index === undefined) return;
  // Even at an edge, so the arrow doesn't scroll the page instead.
  event.preventDefault();
  elements[index]?.focus();
}
