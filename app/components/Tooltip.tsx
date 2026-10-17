"use client";

import {
  type ComponentProps,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  useId,
  useRef,
} from "react";

const LONG_PRESS_MS = 500;

/**
 * Opens on hover, keyboard focus or a long press, and closes on Escape or a press anywhere.
 * An `anchor` places it there instead, and hovering anywhere in it keeps it open.
 */
export function useTooltip(anchor?: () => HTMLElement | null) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const press = useRef<{ timer?: number; held?: boolean }>({});
  const dismiss = useRef<AbortController>(null);

  const hide = () => {
    dismiss.current?.abort();
    tip.current?.hidePopover();
  };

  const show = (button: HTMLElement) => {
    dismiss.current?.abort();
    // One at a time: tell any other open tooltip to close.
    document.dispatchEvent(new Event("tooltipshow"));
    tip.current?.showPopover({ source: anchor?.() ?? button });
    dismiss.current = new AbortController();
    const { signal } = dismiss.current;
    document.addEventListener("tooltipshow", hide, { signal });
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        // Close only the tooltip, not the popover it sits over.
        event.preventDefault();
        hide();
      },
      { signal },
    );
    document.addEventListener("pointerdown", hide, { capture: true, signal });
    document.addEventListener(
      "pointerout",
      (event) => {
        if (event.pointerType !== "touch") release(event.relatedTarget);
      },
      { signal },
    );
  };

  // Hover and keyboard focus share the tooltip, and the pointer may cross onto it.
  const release = (to: EventTarget | null) => {
    const button = trigger.current;
    if (!button || button.matches(":hover, :focus-visible")) return;
    const zone = [button, tip.current, anchor?.()];
    if (to instanceof Node && zone.some((element) => element?.contains(to))) {
      return;
    }
    hide();
  };

  return {
    id,
    trigger: {
      ref: trigger,
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") show(event.currentTarget);
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.matches(":focus-visible")) {
          show(event.currentTarget);
        }
      },
      onBlur: (event: FocusEvent) => release(event.relatedTarget),
      onKeyDown: () => {
        press.current.held = false;
      },
      // Touch has no hover, so a long press shows the tooltip instead of activating.
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        clearTimeout(press.current.timer);
        press.current.held = false;
        if (event.pointerType !== "touch") return;
        const button = event.currentTarget;
        press.current.timer = window.setTimeout(() => {
          press.current.held = true;
          show(button);
        }, LONG_PRESS_MS);
      },
      onPointerUp: () => clearTimeout(press.current.timer),
      onPointerCancel: () => {
        clearTimeout(press.current.timer);
        press.current.held = false;
      },
      onClickCapture: (event: MouseEvent) => {
        if (!press.current.held) {
          hide();
          return;
        }
        press.current.held = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
    tooltip: { ref: tip, id },
  };
}

export const Tooltip = ({ children, ...props }: ComponentProps<"span">) => (
  // Not hint, whose light dismiss closes it on the click or tap that reveals it.
  <span {...props} popover="manual" role="tooltip" className="tooltip">
    <span>{children}</span>
  </span>
);
