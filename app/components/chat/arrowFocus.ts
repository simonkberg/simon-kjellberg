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

/**
 * Moves focus between `elements` with the arrow keys, Home and End: up and down a list, or across a grid of `columns`.
 * Returns whether the key navigates, even where it is past the ends and left to the browser.
 */
export function arrowFocus(
  event: KeyboardEvent,
  elements: HTMLElement[],
  columns?: number,
): boolean {
  // Leaves shortcuts like Cmd+ArrowDown to the browser.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }
  const current = elements.findIndex((element) => element === event.target);
  if (current === -1) return false;
  const index = targetIndex(event.key, current, elements.length - 1, columns);
  if (index === undefined) return false;
  const target = elements[index];
  if (target && target !== event.target) {
    event.preventDefault();
    target.focus();
  }
  return true;
}
