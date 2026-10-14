import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ChatHistoryResult, reactToChatMessage } from "@/actions/chat";
import type { Message } from "@/lib/discord/api";

import { Chat } from "./Chat";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("@/actions/chat"), () => ({ reactToChatMessage: vi.fn() }));

describe("Chat", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "EventSource",
      class MockEventSource {
        close = vi.fn();
        onopen?: () => void;
        onmessage?: () => void;
        onerror?: () => void;
      },
    );
  });

  const chatElement = (result: ChatHistoryResult, dismissed = false) => (
    <Chat
      history={Promise.resolve(result)}
      tipDismissed={Promise.resolve(dismissed)}
      username={Promise.resolve("TestUser")}
    />
  );

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: "msg-1",
    content: "Test message",
    user: { name: "TestUser", color: "hsl(0 100% 50%)" },
    edited: false,
    timestamp: new Date("2025-01-01T00:00:00.000000+00:00"),
    reactions: [],
    replies: [],
    ...overrides,
  });

  it("renders the simon-bot tip until it is dismissed", async () => {
    await act(async () => render(chatElement({ status: "ok", messages: [] })));

    expect(
      screen.getByRole("button", { name: "Dismiss tip" }),
    ).toBeInTheDocument();
  });

  it("hides the simon-bot tip once it has been dismissed", async () => {
    await act(async () =>
      render(chatElement({ status: "ok", messages: [] }, true)),
    );

    expect(
      screen.queryByRole("button", { name: "Dismiss tip" }),
    ).not.toBeInTheDocument();
  });

  it("displays error message when result status is error", async () => {
    const errorResult: ChatHistoryResult = {
      status: "error",
      error: "Failed to fetch",
    };

    await act(async () => render(chatElement(errorResult)));

    expect(
      screen.getByText("Chat is temporarily unavailable :("),
    ).toBeInTheDocument();
  });

  it("renders messages on success", async () => {
    const successResult: ChatHistoryResult = {
      status: "ok",
      messages: [createMessage({ content: "Hello world" })],
    };

    await act(async () => render(chatElement(successResult)));

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  describe("reply flow", () => {
    it("shows reply preview when reply button is clicked", async () => {
      const user = userEvent.setup();
      const message = createMessage({ id: "target-msg", content: "Original" });
      const successResult: ChatHistoryResult = {
        status: "ok",
        messages: [message],
      };

      await act(async () => render(chatElement(successResult)));

      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reply" }));

      expect(screen.getByText("Replying to")).toBeInTheDocument();
    });

    it("shows reply preview for nested message", async () => {
      const user = userEvent.setup();
      const nestedMessage = createMessage({
        id: "nested-msg",
        content: "Nested reply",
      });
      const parentMessage = createMessage({
        id: "parent-msg",
        content: "Parent message",
        replies: [nestedMessage],
      });
      const successResult: ChatHistoryResult = {
        status: "ok",
        messages: [parentMessage],
      };

      await act(async () => render(chatElement(successResult)));

      const replyButtons = screen.getAllByRole("button", { name: "Reply" });
      await user.click(replyButtons[1]!); // Click nested message's reply button

      expect(screen.getByText("Replying to")).toBeInTheDocument();
    });

    it("clears reply when clear button is clicked", async () => {
      const user = userEvent.setup();
      const message = createMessage({ id: "target-msg" });
      const successResult: ChatHistoryResult = {
        status: "ok",
        messages: [message],
      };

      await act(async () => render(chatElement(successResult)));

      await user.click(screen.getByRole("button", { name: "Reply" }));
      expect(screen.getByText("Replying to")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Clear reply" }));
      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();
    });

    it("hides reply preview when message is deleted", async () => {
      const user = userEvent.setup();
      const message = createMessage({
        id: "will-be-deleted",
        content: "Soon gone",
      });
      const initialResult: ChatHistoryResult = {
        status: "ok",
        messages: [message],
      };

      const { rerender } = await act(async () =>
        render(chatElement(initialResult)),
      );

      await user.click(screen.getByRole("button", { name: "Reply" }));
      expect(screen.getByText("Replying to")).toBeInTheDocument();

      // Re-render with messages that don't include the replied-to message
      const updatedResult: ChatHistoryResult = {
        status: "ok",
        messages: [
          createMessage({ id: "different-msg", content: "New message" }),
        ],
      };

      await act(async () => rerender(chatElement(updatedResult)));

      // Reply preview should be hidden since the message no longer exists
      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();
    });
  });

  describe("reactions", () => {
    it("toggles a reaction from its pill", async () => {
      vi.mocked(reactToChatMessage).mockResolvedValue({ status: "ok" });
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            messages: [
              createMessage({
                reactions: [{ emoji: "👍", count: 1, users: ["TestUser"] }],
              }),
            ],
          }),
        ),
      );

      const pill = screen.getByRole("button", { name: "👍 1" });
      expect(pill).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(pill);

      expect(reactToChatMessage).toHaveBeenCalledWith("msg-1", "👍");
    });

    it("shows why a reaction failed", async () => {
      vi.mocked(reactToChatMessage).mockResolvedValue({
        status: "error",
        error: "Rate limit exceeded.",
      });
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            messages: [
              createMessage({
                reactions: [{ emoji: "👍", count: 1, users: [] }],
              }),
            ],
          }),
        ),
      );

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      expect(
        await screen.findByText("Rate limit exceeded."),
      ).toBeInTheDocument();
    });
  });
});
