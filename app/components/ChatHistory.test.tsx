import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatHistoryResult } from "@/actions/chat";
import type { Message } from "@/lib/slack";

import { ChatHistory } from "./ChatHistory";

vi.mock(import("@/actions/cache"), () => ({ refreshClientCache: vi.fn() }));

describe("ChatHistory", () => {
  beforeEach(() => {
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
    }

    vi.stubGlobal("EventSource", MockEventSource);
  });

  it("renders messages as list with nested replies", async () => {
    const mockMessages: Message[] = [
      {
        ts: "1234567890.123456",
        text: "Message without replies",
        user: { name: "User1", color: "hsl(0 100% 50%)" },
        edited: false,
        replies: [],
      },
      {
        ts: "1234567890.234567",
        text: "Message with replies",
        user: { name: "User2", color: "hsl(120 100% 50%)" },
        edited: false,
        replies: [
          {
            ts: "1234567890.345678",
            text: "First reply",
            user: { name: "User3", color: "hsl(240 100% 50%)" },
            edited: false,
          },
          {
            ts: "1234567890.456789",
            text: "Second reply",
            user: { name: "User4", color: "hsl(60 100% 50%)" },
            edited: true,
          },
        ],
      },
    ];

    const successResult: ChatHistoryResult = {
      status: "ok",
      messages: mockMessages,
    };

    await act(() =>
      render(<ChatHistory history={Promise.resolve(successResult)} />),
    );

    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText("Message without replies")).toBeInTheDocument();
    expect(screen.getByText("Message with replies")).toBeInTheDocument();
    expect(screen.getByText("First reply")).toBeInTheDocument();
    expect(screen.getByText("Second reply")).toBeInTheDocument();
  });

  it("displays error message when history fetch fails", async () => {
    const errorResult: ChatHistoryResult = {
      status: "error",
      error: "Failed to fetch chat history",
    };

    await act(() =>
      render(<ChatHistory history={Promise.resolve(errorResult)} />),
    );

    expect(
      screen.getByText("Chat is temporarily unavailable :("),
    ).toBeInTheDocument();
  });
});
