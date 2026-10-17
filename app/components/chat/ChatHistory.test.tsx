import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Message } from "@/lib/discord/api";

import { ChatHistory } from "./ChatHistory";

describe("ChatHistory", () => {
  const defaultReplyProps = { replyToId: null, setReplyToId: vi.fn() };

  it("renders messages as list with deeply nested replies", () => {
    const mockMessages: Message[] = [
      {
        id: "1234567890123456",
        content: "Message without replies",
        user: { name: "User1", color: "hsl(0 100% 50%)" },
        edited: false,
        timestamp: new Date("2025-01-01T00:00:00.000000+00:00"),
        reactions: [],
        replies: [],
      },
      {
        id: "1234567890234567",
        content: "Message with replies",
        user: { name: "User2", color: "hsl(120 100% 50%)" },
        edited: false,
        timestamp: new Date("2025-01-01T00:01:00.000000+00:00"),
        reactions: [],
        replies: [
          {
            id: "1234567890345678",
            content: "First reply",
            user: { name: "User3", color: "hsl(240 100% 50%)" },
            edited: false,
            timestamp: new Date("2025-01-01T00:02:00.000000+00:00"),
            reactions: [],
            replies: [
              {
                id: "1234567890567890",
                content: "Nested reply to first",
                user: { name: "User5", color: "hsl(180 100% 50%)" },
                edited: false,
                timestamp: new Date("2025-01-01T00:03:00.000000+00:00"),
                reactions: [],
                replies: [
                  {
                    id: "1234567890678901",
                    content: "Deeply nested reply",
                    user: { name: "User6", color: "hsl(300 100% 50%)" },
                    edited: false,
                    timestamp: new Date("2025-01-01T00:04:00.000000+00:00"),
                    reactions: [],
                    replies: [],
                  },
                ],
              },
            ],
          },
          {
            id: "1234567890456789",
            content: "Second reply",
            user: { name: "User4", color: "hsl(60 100% 50%)" },
            edited: true,
            timestamp: new Date("2025-01-01T00:05:00.000000+00:00"),
            reactions: [],
            replies: [],
          },
        ],
      },
    ];

    render(<ChatHistory messages={mockMessages} {...defaultReplyProps} />);

    // 1 content list + 3 nested lists (replies → nested reply → deeply nested)
    expect(screen.getAllByRole("list")).toHaveLength(4);

    expect(screen.getByText("Message without replies")).toBeInTheDocument();
    expect(screen.getByText("Message with replies")).toBeInTheDocument();
    expect(screen.getByText("First reply")).toBeInTheDocument();
    expect(screen.getByText("Nested reply to first")).toBeInTheDocument();
    expect(screen.getByText("Deeply nested reply")).toBeInTheDocument();
    expect(screen.getByText("Second reply")).toBeInTheDocument();
  });

  it("renders empty list when no messages", () => {
    render(<ChatHistory messages={[]} {...defaultReplyProps} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  describe("keyboard navigation", () => {
    const message = (
      id: string,
      content: string,
      replies: Message[] = [],
    ): Message => ({
      id,
      content,
      user: { name: "User", color: "hsl(0 100% 50%)" },
      edited: false,
      timestamp: new Date("2025-01-01T00:00:00.000000+00:00"),
      reactions: [],
      replies,
    });

    const messages = [
      message("1", "First", [message("2", "A reply")]),
      message("3", "Last"),
    ];

    const article = (content: string) =>
      screen.getByText(content).closest("article")!;

    it("makes the bottom message the only tab stop", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);

      await user.tab();
      expect(article("Last")).toHaveFocus();

      await user.tab();
      expect(
        within(article("Last")).getByRole("button", { name: "Reply" }),
      ).toHaveFocus();
      await user.tab();
      await user.tab();
      expect(document.body).toHaveFocus();
    });

    it("moves between messages and replies with arrow keys, Home and End", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);

      await user.tab();
      await user.keyboard("{ArrowUp}");
      expect(article("A reply")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(article("First")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(article("First")).toHaveFocus();
      await user.keyboard("{End}");
      expect(article("Last")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(article("First")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(article("A reply")).toHaveFocus();
    });

    it("ignores arrow keys from inside a message", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowUp}");
      expect(
        within(article("Last")).getByRole("button", { name: "Reply" }),
      ).toHaveFocus();
    });

    it("takes links in other messages out of the tab order", () => {
      render(
        <ChatHistory
          messages={[
            message("1", "[First](https://example.com)"),
            message("3", "[Last](https://example.com)"),
          ]}
          {...defaultReplyProps}
        />,
      );

      expect(screen.getByRole("link", { name: "First" })).toHaveAttribute(
        "tabindex",
        "-1",
      );
      expect(screen.getByRole("link", { name: "Last" })).not.toHaveAttribute(
        "tabindex",
      );
    });

    it("moves the controls' tab order with the tab stop", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);
      const reply = (content: string) =>
        within(article(content)).getByRole("button", { name: "Reply" });

      await user.tab();
      await user.keyboard("{ArrowUp}");
      await waitFor(() =>
        expect(reply("Last")).toHaveAttribute("tabindex", "-1"),
      );
      expect(reply("A reply")).not.toHaveAttribute("tabindex");

      await user.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(reply("Last")).not.toHaveAttribute("tabindex"),
      );
      expect(reply("A reply")).toHaveAttribute("tabindex", "-1");
    });

    it("leaves arrow keys with modifiers to the browser", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);

      await user.tab();
      await user.keyboard("{Meta>}{ArrowUp}{/Meta}");
      expect(article("Last")).toHaveFocus();
    });

    it("keeps the tab stop on the message last focused", async () => {
      const user = userEvent.setup();
      render(<ChatHistory messages={messages} {...defaultReplyProps} />);

      await user.click(
        within(article("First")).getByRole("button", { name: "Reply" }),
      );
      expect(article("First")).toHaveAttribute("tabindex", "0");
      expect(article("Last")).toHaveAttribute("tabindex", "-1");

      await user.tab({ shift: true });
      expect(article("First")).toHaveFocus();
    });

    it("falls back to the bottom message when the tab stop is removed", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ChatHistory messages={messages} {...defaultReplyProps} />,
      );

      await user.tab();
      await user.keyboard("{ArrowUp}");
      rerender(
        <ChatHistory
          messages={[message("1", "First"), message("3", "Last")]}
          {...defaultReplyProps}
        />,
      );

      expect(article("Last")).toHaveAttribute("tabindex", "0");
    });

    it("takes controls added to other messages out of the tab order", async () => {
      const { rerender } = render(
        <ChatHistory messages={messages} {...defaultReplyProps} />,
      );

      rerender(
        <ChatHistory
          messages={[
            {
              ...message("1", "First"),
              reactions: [{ emoji: "👍", count: 1, users: [] }],
            },
            message("3", "Last"),
          ]}
          {...defaultReplyProps}
        />,
      );

      await waitFor(() =>
        expect(
          within(article("First")).getByRole("button", { name: /👍/ }),
        ).toHaveAttribute("tabindex", "-1"),
      );
    });
  });
});
