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
    fireEvent.pointerLeave(button, { relatedTarget: tooltip });
    expect(isOpen()).toBe(true);

    fireEvent.pointerLeave(tooltip, { relatedTarget: document.body });
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
    fireEvent.pointerLeave(button, { pointerType: "touch" });

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
});
