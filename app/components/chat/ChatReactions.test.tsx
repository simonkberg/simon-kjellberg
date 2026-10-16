import { fireEvent, render, screen, within } from "@testing-library/react";
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
  const context = {
    username: "me",
    reacting: new Set<string>(),
    react: vi.fn(),
    ...value,
  };
  render(<ChatReactionsContext value={context}>{ui}</ChatReactionsContext>);
  return context;
}

function getPicker() {
  return screen.getByRole("group", { name: "Pick a reaction", hidden: true });
}

// happy-dom has no popover API, so the browser's beforetoggle is sent by hand.
function openPicker() {
  fireEvent(
    getPicker(),
    Object.assign(new Event("beforetoggle"), { newState: "open" }),
  );
}

describe("ChatReactionPicker", () => {
  it("renders no emoji until opened", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);

    expect(
      within(getPicker()).queryAllByRole("button", { hidden: true }),
    ).toEqual([]);
  });

  it("offers every picker emoji with its shortcode", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();

    const items = within(getPicker()).getAllByRole("button", { hidden: true });
    expect(items).toHaveLength(REACTION_EMOJI.length);
    expect(items[0]).toHaveAttribute("title", ":thumbsup:");
    expect(items[0]).toHaveTextContent("👍");
  });

  it("reacts with the picked emoji", async () => {
    const { react } = renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();

    await userEvent.click(
      within(getPicker()).getByRole("button", { name: "tada", hidden: true }),
    );

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });

  it("disables the button only while its own message's reaction is pending", () => {
    renderWithContext(
      <>
        <ChatReactionPicker messageId="1" />
        <ChatReactionPicker messageId="2" />
      </>,
      { reacting: new Set(["1"]) },
    );

    const [busy, free] = screen.getAllByRole("button", {
      name: "Add reaction",
    });
    expect(busy).toBeDisabled();
    expect(free).toBeEnabled();
  });
});

describe("ChatReactionList", () => {
  const reactions: Reaction[] = [
    { emoji: "👍", count: 3, users: ["me", "you"] },
    { emoji: "🎉", count: 1, users: [] },
    { emoji: "🔥", count: 2, users: ["you", "them"] },
  ];

  it("shows each reaction with its count and who reacted", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada, fire] = screen.getAllByRole("button");
    expect(thumbs).toHaveTextContent("👍 3");
    expect(thumbs).toHaveAttribute("title", "me, you, and 1 on Discord");
    expect(tada).toHaveTextContent("🎉 1");
    expect(tada).toHaveAttribute("title", "1 on Discord");
    expect(fire).toHaveAttribute("title", "you and them");
  });

  it("marks the visitor's own reactions as pressed", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada] = screen.getAllByRole("button");
    expect(thumbs).toHaveAttribute("aria-pressed", "true");
    expect(tada).toHaveAttribute("aria-pressed", "false");
  });

  it("follows the visitor's username", () => {
    const context = {
      username: "nobody",
      reacting: new Set<string>(),
      react: vi.fn(),
    };
    const list = (username: string) => (
      <ChatReactionsContext value={{ ...context, username }}>
        <ChatReactionList messageId="1" reactions={reactions} />
      </ChatReactionsContext>
    );
    const { rerender } = render(list("nobody"));

    rerender(list("me"));

    const [thumbs] = screen.getAllByRole("button");
    expect(thumbs).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the reaction when clicked", async () => {
    const { react } = renderWithContext(
      <ChatReactionList messageId="1" reactions={reactions} />,
    );

    await userEvent.click(screen.getAllByRole("button")[1]!);

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });
});
