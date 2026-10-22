import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { HOVER_DELAY_MS } from "@/components/Tooltip";

export const isOpen = (
  popover = screen.getByRole("tooltip", { hidden: true }),
) => popover.hasAttribute("data-popover-open");

// happy-dom has no popover API, so the browser's toggle events are sent by hand.
export const sendToggle = (
  popover: HTMLElement,
  type: "beforetoggle" | "toggle",
  newState: "open" | "closed",
) => fireEvent(popover, Object.assign(new Event(type), { newState }));

export const tap = (target: Element) =>
  act(() => userEvent.pointer({ keys: "[TouchA]", target }));

// Hovers text long enough for its tooltip to show.
export const dwell = async (target: Element) => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  await act(() => userEvent.hover(target));
  await act(() => vi.advanceTimersByTimeAsync(HOVER_DELAY_MS));
};
