import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reaction } from "@/lib/discord/api";
import { REACTION_EMOJI, SKIN_TONES } from "@/lib/emoji";
import { server } from "@/mocks/node";
import { isOpen, sendToggle } from "@/mocks/popover";

import {
  ChatReactionList,
  ChatReactionPicker,
  ChatReactionsContext,
  type ChatReactionsContextValue,
} from "./ChatReactions";
import { setSkinTone } from "./skinTone";

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
  const context = renderWithContext(
    <ChatReactionPicker messageId="1" reactions={[]} />,
  );
  getPicker().showPopover();
  openPicker();
  return context;
}

function getEmoji(name: string | RegExp) {
  return within(getPicker()).getByRole("button", { name, hidden: true });
}

function getEmojis() {
  return within(getPicker())
    .getAllByRole("button", { hidden: true })
    .slice(0, REACTION_EMOJI.length);
}

// happy-dom has no layout, so each emoji gets the row it would sit in.
function layOutGrid(columns: number) {
  const items = getEmojis();
  for (const [index, item] of items.entries()) {
    Object.defineProperty(item, "offsetTop", {
      value: Math.floor(index / columns) * 40,
    });
  }
  return items;
}

describe("ChatReactionPicker", () => {
  it("renders no emoji until opened", () => {
    renderWithContext(<ChatReactionPicker messageId="1" reactions={[]} />);

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
    const toggle = getEmoji(/^Skin tone/);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(getEmoji("Default")).toHaveFocus();
    await user.click(getEmoji("Medium-light"));

    expect(toggle).toHaveTextContent("✋🏼");
    expect(toggle).toHaveAccessibleName("Skin tone: Medium-light");
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

  it("leaves a reaction the visitor already has, in any tone, to its pill", async () => {
    const { react } = renderWithContext(
      <ChatReactionList
        messageId="1"
        reactions={[{ emoji: "👍🏽", count: 1, users: [], mine: true }]}
      />,
    );
    openPicker();

    await userEvent.click(getEmoji("thumbsup"));

    expect(react).not.toHaveBeenCalled();
  });

  it("focuses the first emoji once open", () => {
    renderOpenPicker();
    sendToggle(getPicker(), "toggle", "open");

    expect(getEmoji("thumbsup")).toHaveFocus();
  });

  it("moves a row at a time, counting the columns from the layout", async () => {
    const user = userEvent.setup();
    renderOpenPicker();
    const items = layOutGrid(8);
    items[0]?.focus();

    await user.keyboard("{ArrowDown}");
    expect(items[8]).toHaveFocus();
    await user.keyboard("{End}");
    expect(items.at(-1)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("moves between the last row and the tone row below it", async () => {
    const user = userEvent.setup();
    renderOpenPicker();
    const items = layOutGrid(8);
    items.at(-1)?.focus();

    await user.keyboard("{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
    expect(items.at(-1)).toHaveFocus();
    items.at(-8)?.focus();
    await user.keyboard("{ArrowDown}");
    expect(getEmoji(/^Skin tone/)).toHaveFocus();
    await user.keyboard("{Enter}{ArrowRight}");
    expect(getEmoji("Light")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(items.at(-1)).toHaveFocus();
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
        <ChatReactionPicker messageId="1" reactions={[]} />
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
        <ChatReactionPicker messageId="1" reactions={[]} />
        <ChatReactionPicker messageId="2" reactions={[]} />
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
  const fetched = vi.fn();

  beforeEach(() => {
    server.use(
      http.get("*/api/emoji", () => {
        fetched();
        return HttpResponse.json([["👍", ["thumbsup", "+1"], []]]);
      }),
    );
  });

  const reactions: Reaction[] = [
    { emoji: "👍", count: 3, users: ["alice"], mine: true },
    { emoji: "🎉", count: 1, users: [] },
    { emoji: "🔥", count: 2, users: ["alice", "bob"] },
  ];

  it("shows each reaction with its count and who reacted", () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);

    const [thumbs, tada, fire, add] = screen.getAllByRole("button");
    expect(thumbs).toHaveTextContent("👍 3");
    expect(thumbs).toHaveAccessibleDescription(
      "reacted by you, alice, and 1 on Discord",
    );
    expect(tada).toHaveTextContent("🎉 1");
    expect(tada).toHaveAccessibleDescription("reacted by 1 on Discord");
    expect(fire).toHaveAccessibleDescription("reacted by alice and bob");
    expect(add).toHaveAccessibleName("Add reaction");
  });

  it("names the emoji by its shortcode once the tooltip shows", async () => {
    renderWithContext(<ChatReactionList messageId="1" reactions={reactions} />);
    expect(fetched).not.toHaveBeenCalled();

    const [thumbs] = screen.getAllByRole("button");
    await act(() => userEvent.hover(thumbs!));

    await waitFor(() =>
      expect(thumbs).toHaveAccessibleDescription(
        ":thumbsup: reacted by you, alice, and 1 on Discord",
      ),
    );
    expect(fetched).toHaveBeenCalledOnce();
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

  describe("with skin tones", () => {
    const toned: Reaction[] = [
      { emoji: "👍🏽", count: 2, users: ["alice"], mine: true },
      { emoji: "🎉", count: 1, users: [] },
      { emoji: "👍", count: 1, users: ["alice"] },
      { emoji: "👍🏻", count: 1, users: [] },
    ];

    function renderToned(reactions = toned) {
      const context = renderWithContext(
        <ChatReactionList messageId="1" reactions={reactions} />,
      );
      return { ...context, thumbs: screen.getAllByRole("button")[0]! };
    }

    it("groups an emoji's tones into one pill, default first, named once", async () => {
      const { thumbs } = renderToned();

      const tada = screen.getAllByRole("button")[1];
      expect(thumbs).toHaveTextContent("👍👍🏻👍🏽 4");
      expect(thumbs).toHaveAttribute("aria-pressed", "true");
      expect(tada).toHaveTextContent("🎉 1");
      await act(() => userEvent.hover(thumbs));
      await waitFor(() =>
        expect(thumbs).toHaveAccessibleDescription(
          ":thumbsup: reacted by you, alice, and 1 on Discord",
        ),
      );
    });

    it("takes back the visitor's own reaction in whichever tone it is", async () => {
      const { react, thumbs } = renderToned();

      await userEvent.click(thumbs);

      expect(react).toHaveBeenCalledWith("1", "👍🏽");
    });

    it("adds the visitor's tone when they haven't reacted", async () => {
      setSkinTone(SKIN_TONES[5]);
      const { react, thumbs } = renderToned(
        toned.map((reaction) => ({ ...reaction, mine: false })),
      );

      await userEvent.click(thumbs);

      expect(react).toHaveBeenCalledWith("1", "👍🏿");
    });
  });
});
