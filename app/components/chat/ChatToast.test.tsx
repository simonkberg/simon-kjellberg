import {
  act,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatToast } from "./ChatToast";

describe("ChatToast", () => {
  it("renders nothing when message is undefined", () => {
    const { container } = render(<ChatToast message={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    { variant: "default", live: "polite" },
    { variant: "error", live: "assertive" },
  ] as const)("announces the $variant variant $live", ({ variant, live }) => {
    render(<ChatToast message="Test message" variant={variant} />);
    const toast = screen.getByRole("status");

    expect(toast).toHaveAttribute("aria-live", live);
    expect(toast).toHaveAttribute("aria-atomic", "true");
    expect(toast).toHaveClass("chat-toast", variant);
  });

  it("hides toast when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatToast message="Test message" />);

    const closeButton = screen.getByRole("button", {
      name: "Close notification",
    });
    expect(closeButton).toHaveAttribute("type", "button");

    await user.click(closeButton);

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("shows new message when message prop changes", async () => {
    const { rerender } = render(<ChatToast message="First message" />);
    expect(screen.getByText("First message")).toBeInTheDocument();

    rerender(<ChatToast message="Second message" />);

    expect(screen.getByText("Second message")).toBeInTheDocument();
  });

  it("hides toast when message becomes undefined", async () => {
    const { rerender } = render(<ChatToast message="Test message" />);
    expect(screen.getByText("Test message")).toBeInTheDocument();

    rerender(<ChatToast message={undefined} />);

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  describe("timer", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it("hides the toast once its duration expires, not before", async () => {
      render(<ChatToast message="Test message" duration={10000} />);
      expect(screen.getByText("Test message")).toBeInTheDocument();

      vi.advanceTimersByTime(5000);
      expect(screen.getByText("Test message")).toBeInTheDocument();

      vi.advanceTimersByTime(5000);

      await waitForElementToBeRemoved(() => screen.getByText("Test message"));
    });

    it("resets timer when message changes", async () => {
      const { rerender } = render(
        <ChatToast message="First message" duration={5000} />,
      );
      expect(screen.getByText("First message")).toBeInTheDocument();
      await act(() => vi.advanceTimersByTimeAsync(3000));

      rerender(<ChatToast message="Second message" duration={5000} />);
      await waitFor(() =>
        expect(screen.getByText("Second message")).toBeInTheDocument(),
      );
      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(screen.getByText("Second message")).toBeInTheDocument();

      vi.advanceTimersByTime(2000);

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Second message"),
      );
    });
  });
});
