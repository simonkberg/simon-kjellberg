import type { PostChatMessageResult } from "@/actions/chat";
import { postChatMessage } from "@/actions/chat";
import type { Message } from "@/lib/slack";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";

vi.mock(import("@/actions/chat"), () => ({
  postChatMessage: vi.fn(),
}));

describe("ChatInput", () => {
  const createMockMessage = (text: string): Message => ({
    ts: "1234567890.123456",
    text,
    user: { name: "Test", color: "hsl(0 0% 0%)" },
    edited: false,
    replies: [],
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders input field with correct attributes", () => {
    render(<ChatInput />);
    const input = screen.getByRole("textbox");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "text");
    expect(input).toHaveAttribute("placeholder", "Write a message...");
  });

  it("input is not disabled initially", () => {
    render(<ChatInput />);
    const input = screen.getByRole("textbox");

    expect(input).not.toBeDisabled();
  });

  it("disables input while form is submitting", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = Promise.withResolvers<PostChatMessageResult>();
    const mockMessage = createMockMessage("Hello");

    vi.mocked(postChatMessage).mockReturnValue(promise);

    render(<ChatInput />);
    const input = screen.getByRole("textbox");

    await user.type(input, "Hello");
    await user.keyboard("{Enter}");

    expect(input).toBeDisabled();

    resolve({ status: "ok", message: mockMessage });

    await waitFor(() => {
      expect(input).toBeEnabled();
    });
  });

  it("calls postChatMessage when form is submitted", async () => {
    const user = userEvent.setup();
    const mockMessage = createMockMessage("Test message");

    vi.mocked(postChatMessage).mockResolvedValue({
      status: "ok",
      message: mockMessage,
    });

    render(<ChatInput />);
    const input = screen.getByRole("textbox");

    await user.type(input, "Test message");
    await user.keyboard("{Enter}");

    expect(postChatMessage).toHaveBeenCalled();
  });

  it("clears input and focuses it after successful submission", async () => {
    const user = userEvent.setup();
    const mockMessage = createMockMessage("Test message");

    vi.mocked(postChatMessage).mockResolvedValue({
      status: "ok",
      message: mockMessage,
    });

    render(<ChatInput />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.type(input, "Test message");
    expect(input.value).toBe("Test message");

    await user.keyboard("{Enter}");

    expect(input.value).toBe("");
    expect(input).toHaveFocus();
  });

  it("preserves input and focuses it after failed submission", async () => {
    const user = userEvent.setup();

    vi.mocked(postChatMessage).mockResolvedValue({
      status: "error",
      error: "Rate limit exceeded",
    });

    render(<ChatInput />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.type(input, "Test message");
    expect(input.value).toBe("Test message");

    await user.keyboard("{Enter}");

    expect(await screen.findByText("Rate limit exceeded")).toBeInTheDocument();

    // Input value should be preserved on error
    expect(input.value).toBe("Test message");
    expect(input).toHaveFocus();
  });

  describe("ChatToast integration", () => {
    it("does not show toast initially", () => {
      render(<ChatInput />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not show toast on successful message submission", async () => {
      const user = userEvent.setup();
      const mockMessage = createMockMessage("Test message");

      vi.mocked(postChatMessage).mockResolvedValue({
        status: "ok",
        message: mockMessage,
      });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Test message");
      await user.keyboard("{Enter}");

      expect(postChatMessage).toHaveBeenCalled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows error toast when message submission fails", async () => {
      const user = userEvent.setup();

      vi.mocked(postChatMessage).mockResolvedValue({
        status: "error",
        error: "Failed to post chat message",
      });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Test message");
      await user.keyboard("{Enter}");

      expect(
        await screen.findByText("Failed to post chat message"),
      ).toBeInTheDocument();

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "assertive");
      expect(toast).toHaveClass("error");
    });

    it("allows closing error toast via close button", async () => {
      const user = userEvent.setup();

      vi.mocked(postChatMessage).mockResolvedValue({
        status: "error",
        error: "Network error",
      });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Test message");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("Network error")).toBeInTheDocument();

      const closeButton = screen.getByRole("button", {
        name: "Close notification",
      });
      await user.click(closeButton);

      expect(screen.queryByText("Network error")).not.toBeInTheDocument();
    });

    it("hides error toast after duration", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ delay: null });

      vi.mocked(postChatMessage).mockResolvedValue({
        status: "error",
        error: "Timeout error",
      });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Test message");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("Timeout error")).toBeInTheDocument();

      vi.advanceTimersByTime(5000);
      vi.runAllTimers();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Timeout error"),
      );

      vi.useRealTimers();
    });

    it("shows new error toast when subsequent submission fails", async () => {
      const user = userEvent.setup();

      vi.mocked(postChatMessage)
        .mockResolvedValueOnce({
          status: "error",
          error: "First error",
        })
        .mockResolvedValueOnce({
          status: "error",
          error: "Second error",
        });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "First message");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("First error")).toBeInTheDocument();

      await user.type(input, "Second message");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("Second error")).toBeInTheDocument();
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });

    it("clears error toast when submission succeeds after error", async () => {
      const user = userEvent.setup();
      const mockMessage = createMockMessage("Success message");

      vi.mocked(postChatMessage)
        .mockResolvedValueOnce({
          status: "error",
          error: "Failed to post",
        })
        .mockResolvedValueOnce({
          status: "ok",
          message: mockMessage,
        });

      render(<ChatInput />);
      const input = screen.getByRole("textbox");

      await user.type(input, "First message");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("Failed to post")).toBeInTheDocument();

      await user.type(input, "Second message");
      await user.keyboard("{Enter}");

      expect(screen.queryByText("Failed to post")).not.toBeInTheDocument();
    });
  });
});
