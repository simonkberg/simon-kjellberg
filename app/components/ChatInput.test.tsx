import type { PostChatMessageResult } from "@/actions/chat";
import { postChatMessage } from "@/actions/chat";
import type { Message } from "@/lib/slack";
import { render, screen, waitFor } from "@testing-library/react";
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

    await waitFor(() => {
      expect(input).toBeDisabled();
    });

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

    await waitFor(() => {
      expect(postChatMessage).toHaveBeenCalled();
    });
  });
});
