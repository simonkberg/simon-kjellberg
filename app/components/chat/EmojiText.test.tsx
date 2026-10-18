import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmojiShortcodes } from "@/lib/emoji";
import { server } from "@/mocks/node";
import { tap } from "@/mocks/popover";

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

  // First to show a shortcode, since the set is fetched once per file.
  it("names the emoji by its shortcode, loaded on the first hover", async () => {
    render(<EmojiText text="nice 👍🏽" />);
    expect(fetched).not.toHaveBeenCalled();

    await act(() => userEvent.hover(screen.getByText("👍🏽")));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(":thumbsup:");
    expect(fetched).toHaveBeenCalledOnce();
  });

  it("names the emoji on tap", async () => {
    render(<EmojiText text="❤️" />);

    await tap(screen.getByText("❤️"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(":heart:");
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
});
