import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postChatMessage } from "@/actions/chat";
import { type EmojiShortcodes, REACTION_EMOJI } from "@/lib/emoji";
import { server } from "@/mocks/node";

import { ChatInput } from "./ChatInput";

vi.mock(import("@/actions/chat"), () => ({ postChatMessage: vi.fn() }));

const EMOJI: EmojiShortcodes[] = [
  ["🧑‍🚒", "firefighter"],
  ["🔥", "fire", "flame"],
  ["💀", "skull", "skeleton"],
  ["😀", "grinning"],
  ["😃", "smiley"],
];

const setup = (replyToId: string | null = null) => {
  const setReplyToId = vi.fn();
  const user = userEvent.setup({ delay: null });
  render(
    <ChatInput replyToId={replyToId} setReplyToId={setReplyToId}>
      <button type="button">Next</button>
    </ChatInput>,
  );
  return { user, setReplyToId, input: screen.getByRole("combobox") };
};

const options = () =>
  screen
    .queryAllByRole("option")
    .map((option) => option.textContent)
    .join("");

const chosen = () => screen.queryByRole("option", { selected: true });

describe("ChatEmojiSuggestions", () => {
  beforeEach(() => {
    server.use(http.get("*/api/emoji", () => HttpResponse.json(EMOJI)));
    vi.mocked(postChatMessage).mockResolvedValue({ status: "ok" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("offers the reactions on a bare colon, with none chosen", async () => {
    const { user, input } = setup();

    await user.type(input, "hi :");

    expect(await screen.findAllByRole("option")).toHaveLength(
      REACTION_EMOJI.length,
    );
    expect(chosen()).toBeNull();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("filters by shortcode, and Enter inserts the first instead of sending", async () => {
    const { user, input } = setup();

    await user.type(input, "hi :fire");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(options()).toBe("🔥🧑‍🚒");
    expect(input).toHaveAttribute("aria-activedescendant", chosen()?.id);

    await user.keyboard("{Enter}");

    expect(input).toHaveValue("hi 🔥");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(postChatMessage).not.toHaveBeenCalled();
  });

  it("moves the choice with the arrow keys and picks it with Tab", async () => {
    const { user, input } = setup();

    await user.type(input, ":fire");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowRight}");
    expect(chosen()).toHaveAccessibleName("firefighter");
    await user.keyboard("{ArrowLeft}{ArrowRight}{Tab}");

    expect(input).toHaveValue("🧑‍🚒");
    expect(input).toHaveFocus();
  });

  it("replaces only the shortcode at the caret", async () => {
    const { user, input } = setup();

    await user.type(input, ":sk later");
    await user.keyboard("{ArrowLeft>6/}");
    await screen.findByRole("listbox");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("💀 later");
  });

  it("sends a short emoticon like :S unless an emoji is chosen", async () => {
    const { user, input } = setup();

    await user.type(input, ":S");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(chosen()).toBeNull();
    await user.keyboard("{Enter}");

    expect(postChatMessage).toHaveBeenCalled();
    await waitFor(() => expect(input).toHaveValue(""));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("chooses the first with an up or down arrow when none is", async () => {
    const { user, input } = setup();

    await user.type(input, ":s");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowUp}{Enter}");

    expect(input).toHaveValue("💀");
  });

  it("closes on Escape without clearing the reply, until the shortcode changes", async () => {
    const { user, input, setReplyToId } = setup("message-id");

    await user.type(input, ":sk");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(setReplyToId).not.toHaveBeenCalled();

    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
  });

  it("keeps the choice within the list at its ends, leaving Home and End to the caret", async () => {
    const { user, input } = setup();

    await user.type(input, ":fire");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowUp}{ArrowLeft}{End}");
    expect(chosen()).toHaveAccessibleName("fire");
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");

    expect(chosen()).toHaveAccessibleName("firefighter");
  });

  it("leaves keys to an input method mid-composition", async () => {
    const { user, input } = setup();

    await user.type(input, ":fire");
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(input).toHaveValue(":fire");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes when the browser dismisses it, as on a click outside", async () => {
    const { user, input } = setup();

    await user.type(input, ":fire");
    const picker = await screen.findByRole("listbox");
    fireEvent(
      picker,
      Object.assign(new Event("toggle"), { newState: "closed" }),
    );

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when focus moves on", async () => {
    const { user, input } = setup();

    await user.type(input, ":S");
    await screen.findByRole("listbox");
    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("stays open when a tap takes focus without a new target", async () => {
    const { user, input } = setup();

    await user.type(input, ":fire");
    await screen.findByRole("listbox");
    fireEvent.blur(input, { relatedTarget: null });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("inserts a clicked emoji and keeps focus in the input", async () => {
    const { user, input } = setup();

    await user.type(input, "so :s");
    await user.click(await screen.findByRole("option", { name: "skull" }));

    expect(input).toHaveValue("so 💀");
    expect(input).toHaveFocus();
  });

  it("shows each emoji's shortcode as its tooltip", async () => {
    const { user, input } = setup();

    await user.type(input, ":skel");

    expect(
      await screen.findByRole("option", { name: "skeleton" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      ":skeleton:",
    );
  });

  it.each(["12:30", "https://simon.dev", ":)", ":zzz"])(
    "stays closed for %s",
    async (text) => {
      const { user, input } = setup();

      await user.type(input, text);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    },
  );
});
