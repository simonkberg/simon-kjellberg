import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmojiShortcodes } from "@/lib/emoji";
import { server } from "@/mocks/node";

import { EmojiText } from "./EmojiText";

const EMOJI: EmojiShortcodes[] = [
  ["👍", "thumbsup", "+1"],
  ["❤️", "heart"],
  ["🧑‍🚒", "firefighter"],
  ["🏌️‍♂️", "golfer_man"],
];

const tooltips = () => screen.queryAllByRole("tooltip", { hidden: true });

describe("EmojiText", () => {
  const fetched = vi.fn();

  beforeEach(() => {
    server.use(
      http.get("*/api/emoji", () => {
        fetched();
        return HttpResponse.json(EMOJI);
      }),
    );
  });

  it("wraps each emoji, ZWJ sequences whole, and leaves the text", () => {
    const { container } = render(<EmojiText text="hi 👍 and 🧑‍🚒!" />);

    expect(container).toHaveTextContent("hi 👍 and 🧑‍🚒!");
    expect(tooltips()).toHaveLength(2);
  });

  it("leaves text-style symbols alone", () => {
    render(<EmojiText text="© 2026 ❤ 1" />);

    expect(tooltips()).toHaveLength(0);
  });

  it("names the emoji by its shortcode, loaded on the first hover", async () => {
    render(<EmojiText text="nice 👍🏽" />);
    expect(fetched).not.toHaveBeenCalled();

    await act(() => userEvent.hover(screen.getByText("👍🏽")));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(":thumbsup:");
    expect(fetched).toHaveBeenCalledOnce();
  });

  it("shows on tap", async () => {
    render(<EmojiText text="❤️" />);

    await act(() =>
      userEvent.pointer({ keys: "[TouchA]", target: screen.getByText("❤️") }),
    );

    expect(await screen.findByRole("tooltip")).toHaveTextContent(":heart:");
  });

  it("hides on a second tap", async () => {
    render(<EmojiText text="❤️" />);
    const emoji = screen.getByText("❤️");
    const tooltip = screen.getByRole("tooltip", { hidden: true });

    await act(() => userEvent.pointer({ keys: "[TouchA]", target: emoji }));
    expect(tooltip).toHaveAttribute("data-popover-open");
    await act(() => userEvent.pointer({ keys: "[TouchA]", target: emoji }));
    expect(tooltip).not.toHaveAttribute("data-popover-open");
    await act(() => userEvent.pointer({ keys: "[TouchA]", target: emoji }));
    expect(tooltip).toHaveAttribute("data-popover-open");
  });

  it("names toned emoji whose base has a text style", async () => {
    render(<EmojiText text="🏌🏽‍♂️" />);

    await act(() => userEvent.hover(screen.getByText("🏌🏽‍♂️")));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      ":golfer_man:",
    );
  });

  it("leaves the tooltip empty for an emoji the set doesn't name", async () => {
    render(<EmojiText text="🫩" />);

    await act(() => userEvent.hover(screen.getByText("🫩")));

    await vi.waitFor(() =>
      expect(
        screen.getByRole("tooltip").firstElementChild,
      ).toBeEmptyDOMElement(),
    );
  });

  it("doesn't show at the end of a long press that selected text", async () => {
    render(<EmojiText text="❤️" />);
    const emoji = screen.getByText("❤️");
    getSelection()?.selectAllChildren(emoji);

    await act(() => userEvent.pointer({ keys: "[TouchA]", target: emoji }));

    expect(screen.getByRole("tooltip", { hidden: true })).not.toHaveAttribute(
      "data-popover-open",
    );
    getSelection()?.removeAllRanges();
  });

  it("shows on tap while other text is selected", async () => {
    render(
      <>
        <p>elsewhere</p>
        <EmojiText text="❤️" />
      </>,
    );
    getSelection()?.selectAllChildren(screen.getByText("elsewhere"));

    await act(() =>
      userEvent.pointer({ keys: "[TouchA]", target: screen.getByText("❤️") }),
    );

    expect(screen.getByRole("tooltip", { hidden: true })).toHaveAttribute(
      "data-popover-open",
    );
    getSelection()?.removeAllRanges();
  });

  it("hides on a mouse click, as on buttons", async () => {
    render(<EmojiText text="👍" />);
    const emoji = screen.getByText("👍");

    const tooltip = screen.getByRole("tooltip", { hidden: true });

    await act(() => userEvent.hover(emoji));
    expect(tooltip).toHaveAttribute("data-popover-open");
    await act(() => userEvent.click(emoji));

    expect(tooltip).not.toHaveAttribute("data-popover-open");
  });

  it("is not a tab stop", async () => {
    render(<EmojiText text="👍 ❤️" />);

    await userEvent.tab();

    expect(document.body).toHaveFocus();
  });
});
