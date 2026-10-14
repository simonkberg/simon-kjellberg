import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";

import {
  ChatReactionList,
  ChatReactionPicker,
  ChatReactionsContext,
  type ChatReactionsContextValue,
} from "./ChatReactions";

function renderWithContext(
  ui: React.ReactNode,
  value: Partial<ChatReactionsContextValue> = {},
) {
  const context = { username: "me", pending: false, react: vi.fn(), ...value };
  render(<ChatReactionsContext value={context}>{ui}</ChatReactionsContext>);
  return context;
}

describe("ChatReactionPicker", () => {
  it("offers every picker emoji with its shortcode", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);

    const items = screen.getAllByRole("menuitem", { hidden: true });
    expect(items).toHaveLength(REACTION_EMOJI.length);
    expect(items[0]).toHaveAttribute("title", ":thumbsup:");
    expect(items[0]).toHaveTextContent("👍");
  });

  it("reacts with the picked emoji", async () => {
    const { react } = renderWithContext(<ChatReactionPicker messageId="1" />);

    await userEvent.click(
      screen.getByRole("menuitem", { name: "tada", hidden: true }),
    );

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });

  it("disables the button while a reaction is pending", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />, { pending: true });

    expect(screen.getByRole("button", { name: "Add reaction" })).toBeDisabled();
  });
});

describe("ChatReactionList", () => {
  const reactions: Reaction[] = [
    { emoji: "👍", count: 3, users: ["me", "you"] },
    { emoji: "🎉", count: 1, users: [] },
  ];

  it("shows each reaction with its count and who reacted", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada] = screen.getAllByRole("button");
    expect(thumbs).toHaveTextContent("👍 3");
    expect(thumbs).toHaveAttribute("title", "me, you, and 1 on Discord");
    expect(tada).toHaveTextContent("🎉 1");
    expect(tada).toHaveAttribute("title", "1 on Discord");
  });

  it("marks the visitor's own reactions as pressed", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada] = screen.getAllByRole("button");
    expect(thumbs).toHaveAttribute("aria-pressed", "true");
    expect(tada).toHaveAttribute("aria-pressed", "false");
  });

  it("marks nothing as pressed before the visitor has a username", () => {
    renderWithContext(
      <ChatReactionList messageId="1" reactions={reactions} />,
      { username: null },
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("toggles the reaction when clicked", async () => {
    const { react } = renderWithContext(
      <ChatReactionList messageId="1" reactions={reactions} />,
    );

    await userEvent.click(screen.getAllByRole("button")[1]!);

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });
});
