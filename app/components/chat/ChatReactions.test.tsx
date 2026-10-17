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
  const context = { reacting: new Set<string>(), react: vi.fn(), ...value };
  render(<ChatReactionsContext value={context}>{ui}</ChatReactionsContext>);
  return context;
}

function getPicker() {
  return screen.getByRole("toolbar", { name: "Pick a reaction", hidden: true });
}

// happy-dom has no popover API, so the browser's toggle events are sent by hand.
function sendToggle(type: "beforetoggle" | "toggle", newState: string) {
  fireEvent(getPicker(), Object.assign(new Event(type), { newState }));
}

function openPicker() {
  sendToggle("beforetoggle", "open");
}

function getEmoji(name: string) {
  return within(getPicker()).getByRole("button", { name, hidden: true });
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
    expect(items[0]).toHaveTextContent("👍");
    expect(
      within(getPicker()).getAllByRole("tooltip", { hidden: true })[0],
    ).toHaveTextContent(":thumbsup:");
  });

  it("reacts with the picked emoji", async () => {
    const { react } = renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();

    await userEvent.click(
      within(getPicker()).getByRole("button", { name: "tada", hidden: true }),
    );

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });

  it("focuses the first emoji once open", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();
    sendToggle("toggle", "open");

    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it("moves between emoji with the arrow keys, by row up and down", async () => {
    const user = userEvent.setup();
    renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();
    const items = within(getPicker()).getAllByRole("button", { hidden: true });
    for (const [index, item] of items.entries()) {
      Object.defineProperty(item, "offsetTop", {
        value: Math.floor(index / 8) * 40,
      });
    }
    items[0]?.focus();

    await user.keyboard("{ArrowRight}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[9]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(items[8]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{End}");
    expect(items.at(-1)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("leaves other keys and modified arrows to the browser", async () => {
    const user = userEvent.setup();
    renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();
    getEmoji("thumbsup").focus();

    await user.keyboard("a{Alt>}{ArrowRight}{/Alt}");

    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it.each(["{Tab}", "{Shift>}{Tab}{/Shift}"])("closes on %s", async (keys) => {
    const user = userEvent.setup();
    renderWithContext(<ChatReactionPicker messageId="1" />);
    getPicker().showPopover();
    openPicker();
    getEmoji("heart").focus();

    await user.keyboard(keys);

    expect(getPicker()).not.toHaveAttribute("data-popover-open");
  });

  it("returns focus to its button when it closes around it", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);
    openPicker();
    getEmoji("heart").focus();

    sendToggle("beforetoggle", "closed");
    sendToggle("toggle", "closed");

    expect(screen.getByRole("button", { name: "Add reaction" })).toHaveFocus();
  });

  it("returns focus to its message when a pick has disabled its button", () => {
    renderWithContext(
      <article className="chat-message" tabIndex={-1}>
        <ChatReactionPicker messageId="1" />
      </article>,
      { reacting: new Set(["1"]) },
    );
    openPicker();
    getEmoji("heart").focus();

    sendToggle("beforetoggle", "closed");

    expect(screen.getByRole("article")).toHaveFocus();
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
  const openTips = () =>
    screen
      .queryAllByRole("tooltip", { hidden: true })
      .filter((tip) => tip.hasAttribute("data-popover-open"))
      .map((tip) => tip.textContent);

  const reactions: Reaction[] = [
    { emoji: "👍", count: 3, users: ["alice"], mine: true },
    { emoji: "🎉", count: 1, users: [] },
    { emoji: "🔥", count: 2, users: ["alice", "bob"] },
  ];

  it("shows each reaction with its count and who reacted", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada, fire, add] = screen.getAllByRole("button");
    expect(thumbs).toHaveTextContent("👍 3");
    expect(thumbs).toHaveAccessibleDescription("You, alice, and 1 on Discord");
    expect(tada).toHaveTextContent("🎉 1");
    expect(tada).toHaveAccessibleDescription("1 on Discord");
    expect(fire).toHaveAccessibleDescription("alice and bob");
    expect(add).toHaveAccessibleName("Add reaction");
  });

  it("marks the visitor's own reactions as pressed", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada] = screen.getAllByRole("button");
    expect(thumbs).toHaveAttribute("aria-pressed", "true");
    expect(tada).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the reaction when clicked", async () => {
    const { react } = renderWithContext(
      <ChatReactionList messageId="1" reactions={reactions} />,
    );

    await userEvent.click(screen.getAllByRole("button")[1]!);

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });

  it("shows who reacted while hovered", async () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    await userEvent.hover(screen.getAllByRole("button")[2]!);
    expect(openTips()).toEqual(["alice and bob"]);

    await userEvent.unhover(screen.getAllByRole("button")[2]!);
    expect(openTips()).toEqual([]);
  });
});
