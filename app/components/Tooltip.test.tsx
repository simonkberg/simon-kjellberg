import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tooltip, useTooltip } from "./Tooltip";

const Button = ({ onClick = () => {} }: { onClick?: () => void }) => {
  const tooltip = useTooltip();

  return (
    <>
      <button
        aria-labelledby={tooltip.id}
        onClick={onClick}
        {...tooltip.trigger}
      >
        ↩
      </button>
      <Tooltip {...tooltip.tooltip}>Reply</Tooltip>
      <button>Elsewhere</button>
    </>
  );
};

const Anchored = ({ label }: { label: string }) => {
  const tooltip = useTooltip(() => document.getElementById("anchor"));

  return (
    <>
      <button aria-labelledby={tooltip.id} {...tooltip.trigger}>
        ·
      </button>
      <Tooltip {...tooltip.tooltip}>{label}</Tooltip>
    </>
  );
};

const isOpen = () =>
  screen
    .getByRole("tooltip", { hidden: true })
    .hasAttribute("data-popover-open");

describe("Tooltip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels its button", () => {
    render(<Button />);

    expect(screen.getByRole("button", { name: "Reply" })).toBeInTheDocument();
  });

  it("shows while hovered", async () => {
    render(<Button />);

    await userEvent.hover(screen.getByRole("button", { name: "Reply" }));
    expect(isOpen()).toBe(true);

    await userEvent.unhover(screen.getByRole("button", { name: "Reply" }));
    expect(isOpen()).toBe(false);
  });

  it("stays while the pointer moves onto it", async () => {
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });

    await userEvent.hover(button);
    fireEvent.pointerOut(button, { relatedTarget: tooltip });
    expect(isOpen()).toBe(true);

    fireEvent.pointerOut(tooltip, { relatedTarget: null });
    expect(isOpen()).toBe(false);
  });

  it("closes on Escape while hovered, wherever focus is", async () => {
    render(<Button />);

    await userEvent.hover(screen.getByRole("button", { name: "Reply" }));
    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(isOpen()).toBe(false);
  });

  it("closes on a press anywhere", async () => {
    render(<Button />);

    await userEvent.hover(screen.getByRole("button", { name: "Reply" }));
    fireEvent.pointerDown(document.body);

    expect(isOpen()).toBe(false);
  });

  it("closes when its button is clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} />);

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });

  it("shows on keyboard focus until focus moves on", async () => {
    render(<Button />);

    await userEvent.tab();
    expect(isOpen()).toBe(true);

    await userEvent.tab();
    expect(isOpen()).toBe(false);
  });

  it("keeps a focused button's tooltip when the pointer leaves it", async () => {
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });

    await userEvent.tab();
    await userEvent.hover(button);
    await userEvent.unhover(button);

    expect(isOpen()).toBe(true);
  });

  // happy-dom matches :focus-visible on every focus and :hover never, so these stub the browser's answer.
  it("shows nothing when a click focuses the button", () => {
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });

    vi.spyOn(button, "matches").mockReturnValue(false);
    fireEvent.focus(button);

    expect(isOpen()).toBe(false);
  });

  it("stays on a blur under the pointer", async () => {
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });

    await userEvent.hover(button);
    vi.spyOn(button, "matches").mockReturnValue(true);
    fireEvent.blur(button);

    expect(isOpen()).toBe(true);
  });

  it("shows on a long press instead of activating", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Button onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerEnter(button, { pointerType: "touch" });
    fireEvent.pointerDown(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);
    fireEvent.pointerUp(button, { pointerType: "touch" });
    fireEvent.click(button);
    fireEvent.pointerOut(button, { pointerType: "touch" });

    expect(isOpen()).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("activates on a short tap", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Button onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerDown(button, { pointerType: "touch" });
    vi.advanceTimersByTime(100);
    fireEvent.pointerUp(button, { pointerType: "touch" });
    fireEvent.click(button);
    vi.advanceTimersByTime(500);

    expect(isOpen()).toBe(false);
    expect(onClick).toHaveBeenCalled();
  });

  it("shows nothing when a press turns into a scroll", () => {
    vi.useFakeTimers();
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerDown(button, { pointerType: "touch" });
    fireEvent.pointerCancel(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);

    expect(isOpen()).toBe(false);
  });

  it("shows nothing after a tap with two fingers", () => {
    vi.useFakeTimers();
    render(<Button />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerDown(button, { pointerType: "touch" });
    fireEvent.pointerDown(button, { pointerType: "touch" });
    fireEvent.pointerUp(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);

    expect(isOpen()).toBe(false);
  });

  it("activates on a click after a long press that turned into a scroll", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Button onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerDown(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);
    fireEvent.pointerCancel(button, { pointerType: "touch" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("activates from the keyboard after a long press that ended off the button", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Button onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Reply" });

    fireEvent.pointerDown(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);
    fireEvent.pointerUp(button, { pointerType: "touch" });
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("shows one tooltip at a time", async () => {
    render(
      <>
        <Button />
        <Button />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Reply" });
    const [firstTip, secondTip] = screen.getAllByRole("tooltip", {
      hidden: true,
    });

    await userEvent.tab();
    fireEvent.pointerEnter(second!);

    expect(first).toHaveFocus();
    expect(firstTip).not.toHaveAttribute("data-popover-open");
    expect(secondTip).toHaveAttribute("data-popover-open");
  });

  it("stays open anywhere in its anchor", () => {
    render(
      <div id="anchor">
        <Anchored label="Smile" />
        <Anchored label="Frown" />
      </div>,
    );
    const anchor = document.getElementById("anchor")!;
    const smile = screen.getByRole("button", { name: "Smile" });
    const tips = () =>
      screen
        .getAllByRole("tooltip", { hidden: true })
        .map((tip) => tip.hasAttribute("data-popover-open"));

    fireEvent.pointerEnter(smile);
    fireEvent.pointerOut(smile, { relatedTarget: anchor });
    expect(tips()).toEqual([true, false]);

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Frown" }));
    expect(tips()).toEqual([false, true]);

    fireEvent.pointerOut(anchor, { relatedTarget: document.body });
    expect(tips()).toEqual([false, false]);
  });
});
