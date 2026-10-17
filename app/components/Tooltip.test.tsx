import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipButton } from "./Tooltip";

const renderButton = () => {
  const onClick = vi.fn();
  render(
    <>
      <TooltipButton tooltip="Reply" onClick={onClick}>
        ↩
      </TooltipButton>
      <button>Elsewhere</button>
    </>,
  );
  return { button: screen.getByRole("button", { name: "Reply" }), onClick };
};

const isOpen = (tip = screen.getByRole("tooltip", { hidden: true })) =>
  tip.hasAttribute("data-popover-open");

describe("TooltipButton", () => {
  it("is named by its tooltip", () => {
    renderButton();

    expect(screen.getByRole("button", { name: "Reply" })).toBeInTheDocument();
  });

  it("is described by its tooltip with describes", () => {
    render(
      <TooltipButton tooltip="You and alice" describes>
        👍 2
      </TooltipButton>,
    );

    expect(
      screen.getByRole("button", { name: "👍 2" }),
    ).toHaveAccessibleDescription("You and alice");
  });

  it("keeps its own aria-label", () => {
    render(
      <TooltipButton tooltip=":tada:" aria-label="tada">
        🎉
      </TooltipButton>,
    );

    expect(screen.getByRole("button", { name: "tada" })).toBeInTheDocument();
  });

  it("shows while hovered", async () => {
    const { button } = renderButton();

    await userEvent.hover(button);
    expect(isOpen()).toBe(true);

    await userEvent.unhover(button);
    expect(isOpen()).toBe(false);
  });

  it("stays while the pointer moves onto it", async () => {
    const { button } = renderButton();
    const tooltip = screen.getByRole("tooltip", { hidden: true });

    await userEvent.hover(button);
    fireEvent.pointerOut(button, { relatedTarget: tooltip });
    expect(isOpen()).toBe(true);

    fireEvent.pointerOut(tooltip, { relatedTarget: null });
    expect(isOpen()).toBe(false);
  });

  it("closes on Escape while hovered, leaving the Escape to nothing else", async () => {
    const { button } = renderButton();

    await userEvent.hover(button);
    const notCancelled = fireEvent.keyDown(document.body, { key: "Escape" });

    expect(isOpen()).toBe(false);
    expect(notCancelled).toBe(false);
  });

  it("closes on a press anywhere", async () => {
    const { button } = renderButton();

    await userEvent.hover(button);
    fireEvent.pointerDown(document.body);

    expect(isOpen()).toBe(false);
  });

  it("closes when its button is clicked", async () => {
    const { onClick } = renderButton();

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });

  it("shows on keyboard focus until focus moves on", async () => {
    renderButton();

    await userEvent.tab();
    expect(isOpen()).toBe(true);

    await userEvent.tab();
    expect(isOpen()).toBe(false);
  });

  it("keeps a focused button's tooltip when the pointer leaves it", async () => {
    const { button } = renderButton();

    await userEvent.tab();
    await userEvent.hover(button);
    await userEvent.unhover(button);

    expect(isOpen()).toBe(true);
  });

  // happy-dom matches :focus-visible on every focus and :hover never, so these stub the browser's answer.
  it("shows nothing when a click focuses the button", () => {
    const { button } = renderButton();

    vi.spyOn(button, "matches").mockReturnValue(false);
    fireEvent.focus(button);

    expect(isOpen()).toBe(false);
  });

  it("stays on a blur under the pointer", async () => {
    const { button } = renderButton();

    await userEvent.hover(button);
    vi.spyOn(button, "matches").mockReturnValue(true);
    fireEvent.blur(button);

    expect(isOpen()).toBe(true);
  });

  it("shows one tooltip at a time", async () => {
    render(
      <>
        <TooltipButton tooltip="Reply">↩</TooltipButton>
        <TooltipButton tooltip="Reply">↩</TooltipButton>
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Reply" });
    const [firstTip, secondTip] = screen.getAllByRole("tooltip", {
      hidden: true,
    });

    await userEvent.tab();
    fireEvent.pointerEnter(second!);

    expect(first).toHaveFocus();
    expect(isOpen(firstTip)).toBe(false);
    expect(isOpen(secondTip)).toBe(true);
  });

  it("stays open when shown again", async () => {
    const { button } = renderButton();
    const hidePopover = vi.spyOn(
      screen.getByRole("tooltip", { hidden: true }),
      "hidePopover",
    );

    await userEvent.tab();
    await userEvent.hover(button);

    expect(hidePopover).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("stays open anywhere in its anchor", () => {
    render(
      <div id="anchor">
        <TooltipButton tooltip="Smile" anchor="anchor">
          ·
        </TooltipButton>
        <TooltipButton tooltip="Frown" anchor="anchor">
          ·
        </TooltipButton>
      </div>,
    );
    const anchor = document.getElementById("anchor")!;
    const smile = screen.getByRole("button", { name: "Smile" });
    const tips = () =>
      screen
        .getAllByRole("tooltip", { hidden: true })
        .map((tip) => isOpen(tip));

    fireEvent.pointerEnter(smile);
    fireEvent.pointerOut(smile, { relatedTarget: anchor });
    expect(tips()).toEqual([true, false]);

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Frown" }));
    expect(tips()).toEqual([false, true]);

    fireEvent.pointerOut(anchor, { relatedTarget: document.body });
    expect(tips()).toEqual([false, false]);
  });

  describe("on touch", () => {
    const touch = { pointerType: "touch" };
    const longPress = (button: HTMLElement) => {
      fireEvent.pointerDown(button, touch);
      vi.advanceTimersByTime(500);
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows on a long press instead of activating", () => {
      const { button, onClick } = renderButton();

      fireEvent.pointerEnter(button, touch);
      longPress(button);
      fireEvent.pointerUp(button, touch);
      fireEvent.click(button);
      fireEvent.pointerOut(button, touch);

      expect(isOpen()).toBe(true);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("activates on a short tap", () => {
      const { button, onClick } = renderButton();

      fireEvent.pointerDown(button, touch);
      vi.advanceTimersByTime(100);
      fireEvent.pointerUp(button, touch);
      fireEvent.click(button);
      vi.advanceTimersByTime(500);

      expect(isOpen()).toBe(false);
      expect(onClick).toHaveBeenCalled();
    });

    it("shows nothing when a press turns into a scroll", () => {
      const { button } = renderButton();

      fireEvent.pointerDown(button, touch);
      fireEvent.pointerCancel(button, touch);
      vi.advanceTimersByTime(500);

      expect(isOpen()).toBe(false);
    });

    it("shows nothing after a tap with two fingers", () => {
      const { button } = renderButton();

      fireEvent.pointerDown(button, touch);
      fireEvent.pointerDown(button, touch);
      fireEvent.pointerUp(button, touch);
      vi.advanceTimersByTime(500);

      expect(isOpen()).toBe(false);
    });

    it("activates on a click after a long press that turned into a scroll", () => {
      const { button, onClick } = renderButton();

      longPress(button);
      fireEvent.pointerCancel(button, touch);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalled();
    });

    it("activates from the keyboard after a long press that ended off the button", () => {
      const { button, onClick } = renderButton();

      longPress(button);
      fireEvent.pointerUp(button, touch);
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalled();
    });
  });
});
