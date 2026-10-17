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

  it("is not a tab stop", async () => {
    render(<EmojiText text="👍 ❤️" />);

    await userEvent.tab();

    expect(document.body).toHaveFocus();
  });
});
