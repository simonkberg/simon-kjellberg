type ArrowKeyEvent = Pick<
  KeyboardEvent,
  "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey"
>;

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

/** The columns of a wrapping grid, counted along its first row. */
export function gridColumns(elements: HTMLElement[]): number {
  const top = elements[0]?.offsetTop;
  const wrap = elements.findIndex((element) => element.offsetTop !== top);
  return wrap === -1 ? elements.length : wrap;
}

/** The index the key moves to, possibly out of range, or undefined when it doesn't navigate. */
export function arrowIndex(
  event: ArrowKeyEvent,
  current: number,
  last: number,
  columns?: number,
): number | undefined {
  // Leaves shortcuts like Cmd+ArrowDown to the browser.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return undefined;
  }
  return targetIndex(event.key, current, last, columns);
}

/** Returns whether the key navigates, even past the ends, where it is left to the browser. */
export function arrowFocus(
  event: ArrowKeyEvent & Pick<Event, "target" | "preventDefault">,
  elements: HTMLElement[],
  columns?: number,
): boolean {
  const current = elements.findIndex((element) => element === event.target);
  if (current === -1) return false;
  const index = arrowIndex(event, current, elements.length - 1, columns);
  if (index === undefined) return false;
  const target = elements[index];
  if (target && target !== event.target) {
    event.preventDefault();
    target.focus();
  }
  return true;
}
