"use client";

import {
  type ComponentProps,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

const LONG_PRESS_MS = 500;

function useTooltip(anchorId?: string) {
  const tip = useRef<HTMLSpanElement>(null);
  const press = useRef<{ timer?: number; held?: boolean }>({});
  const dismiss = useRef<AbortController>(null);
  const anchor = () => (anchorId ? document.getElementById(anchorId) : null);

  useEffect(
    () => () => {
      dismiss.current?.abort();
      clearTimeout(press.current.timer);
    },
    [],
  );

  const hide = () => {
    dismiss.current?.abort();
    tip.current?.hidePopover();
  };

  const show = (button: HTMLElement) => {
    dismiss.current?.abort();
    document.dispatchEvent(new Event("tooltipshow"));
    tip.current?.showPopover({ source: anchor() ?? button });
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
        if (event.pointerType !== "touch") release(button, event.relatedTarget);
      },
      { signal },
    );
  };

  // Hover and keyboard focus share the tooltip, and the pointer may cross onto it.
  const release = (button: Element, to: EventTarget | null) => {
    if (button.matches(":hover, :focus-visible")) return;
    const zone = [button, tip.current, anchor()];
    if (to instanceof Node && zone.some((element) => element?.contains(to))) {
      return;
    }
    hide();
  };

  return {
    tip,
    trigger: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") show(event.currentTarget);
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.matches(":focus-visible")) {
          show(event.currentTarget);
        }
      },
      onBlur: (event: FocusEvent) =>
        release(event.currentTarget, event.relatedTarget),
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
  };
}

/**
 * A button whose tooltip names it, or describes it with `describes`; an `aria-label` keeps
 * its own name. With `anchor`, the tooltip sits on that element and hovering it keeps it open.
 */
export const TooltipButton = ({
  tooltip,
  describes,
  anchor,
  ...props
}: ComponentProps<"button"> & {
  tooltip: ReactNode;
  describes?: boolean;
  anchor?: string;
}) => {
  const id = useId();
  const { tip, trigger } = useTooltip(anchor);
  const link = describes
    ? { "aria-describedby": id }
    : props["aria-label"]
      ? {}
      : { "aria-labelledby": id };

  return (
    <>
      <button {...link} {...props} {...trigger} data-tooltip-trigger="" />
      {/* Not hint, whose light dismiss closes it on the click or tap that reveals it. */}
      <span
        ref={tip}
        id={id}
        popover="manual"
        role="tooltip"
        className="tooltip"
      >
        <span>{tooltip}</span>
      </span>
    </>
  );
};
