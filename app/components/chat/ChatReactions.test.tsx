import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI } from "@/lib/emoji";
import { isOpen, sendToggle } from "@/mocks/popover";

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

function openPicker() {
  sendToggle(getPicker(), "beforetoggle", "open");
}

function renderOpenPicker() {
  const context = renderWithContext(<ChatReactionPicker messageId="1" />);
  getPicker().showPopover();
  openPicker();
  return context;
}

function getEmoji(name: string) {
  return within(getPicker()).getByRole("button", { name, hidden: true });
}

function getEmojis() {
  return within(getPicker())
    .getAllByRole("button", { hidden: true })
    .slice(0, REACTION_EMOJI.length);
}

afterEach(() => {
  localStorage.clear();
});

describe("ChatReactionPicker", () => {
  it("renders no emoji until opened", () => {
    renderWithContext(<ChatReactionPicker messageId="1" />);

    expect(
      within(getPicker()).queryAllByRole("button", { hidden: true }),
    ).toEqual([]);
  });

  it("offers every picker emoji with its shortcode", () => {
    renderOpenPicker();

    const items = getEmojis();
    expect(items).toHaveLength(REACTION_EMOJI.length);
    expect(items[0]).toHaveTextContent("👍");
    expect(
      within(getPicker()).getAllByRole("tooltip", { hidden: true })[0],
    ).toHaveTextContent(":thumbsup:");
  });

  it("reacts with the picked emoji", async () => {
    const { react } = renderOpenPicker();

    await userEvent.click(getEmoji("tada"));

    expect(react).toHaveBeenCalledWith("1", "🎉");
  });

  it("reacts in the picked skin tone, and keeps it", async () => {
    const user = userEvent.setup();
    const { react } = renderOpenPicker();
    const toggle = getEmoji("Skin tone");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(getEmoji("Default")).toHaveFocus();
    await user.click(getEmoji("Medium-light"));

    expect(toggle).toHaveTextContent("✋🏼");
    expect(toggle).toHaveFocus();
    expect(
      within(getPicker()).queryByRole("button", {
        name: "Default",
        hidden: true,
      }),
    ).toBeNull();
    expect(getEmoji("tada")).toHaveTextContent("🎉");
    await user.click(getEmoji("thumbsup"));
    expect(react).toHaveBeenCalledWith("1", "👍🏼");
    expect(localStorage.getItem("skin-tone")).toBe("2");
  });

  it("focuses the first emoji once open", () => {
    renderOpenPicker();
    sendToggle(getPicker(), "toggle", "open");

    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it("moves a row at a time, counting the columns from the layout", async () => {
    const user = userEvent.setup();
    renderOpenPicker();
    const items = getEmojis();
    for (const [index, item] of items.entries()) {
      Object.defineProperty(item, "offsetTop", {
        value: Math.floor(index / 8) * 40,
      });
    }
    items[0]?.focus();

    await user.keyboard("{ArrowDown}");
    expect(items[8]).toHaveFocus();
    await user.keyboard("{End}");
    expect(getEmoji("Skin tone")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("keeps arrows at its edges from scrolling the page", () => {
    renderOpenPicker();
    getEmoji("thumbsup").focus();

    expect(fireEvent.keyDown(getEmoji("thumbsup"), { key: "ArrowUp" })).toBe(
      false,
    );
    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it("leaves other keys and modified arrows to the browser", () => {
    renderOpenPicker();
    getEmoji("thumbsup").focus();

    expect(fireEvent.keyDown(getEmoji("thumbsup"), { key: "a" })).toBe(true);
    expect(
      fireEvent.keyDown(getEmoji("thumbsup"), {
        key: "ArrowRight",
        altKey: true,
      }),
    ).toBe(true);
    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it.each(["{Tab}", "{Shift>}{Tab}{/Shift}"])("closes on %s", async (keys) => {
    const user = userEvent.setup();
    renderOpenPicker();
    getEmoji("heart").focus();

    await user.keyboard(keys);

    expect(isOpen(getPicker())).toBe(false);
  });

  it("closes on Escape without leaving it to the page", () => {
    renderOpenPicker();
    getEmoji("heart").focus();

    expect(fireEvent.keyDown(getEmoji("heart"), { key: "Escape" })).toBe(false);
    expect(isOpen(getPicker())).toBe(false);
  });

  it("returns focus to its button when it closes around it", () => {
    renderOpenPicker();
    getEmoji("heart").focus();

    sendToggle(getPicker(), "beforetoggle", "closed");
    sendToggle(getPicker(), "toggle", "closed");

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

    sendToggle(getPicker(), "beforetoggle", "closed");

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
});
