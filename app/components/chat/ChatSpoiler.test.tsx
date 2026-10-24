import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChatSpoiler } from "./ChatSpoiler";

const renderSpoiler = () =>
  render(
    <ChatSpoiler>
      secret <a href="https://simon.dev">link</a>
    </ChatSpoiler>,
  );

describe("ChatSpoiler", () => {
  it("hides its content from focus and assistive tech until revealed", () => {
    renderSpoiler();

    expect(screen.getByRole("button", { name: "Spoiler" })).toBeDefined();
    expect(screen.getByText("link").closest("[inert]")).not.toBeNull();
  });

  it("reveals on click, for good", async () => {
    renderSpoiler();

    await userEvent.click(screen.getByRole("button", { name: "Spoiler" }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "link" })).toBeDefined();
  });

  it("keeps its content mounted as it reveals", async () => {
    renderSpoiler();
    const link = screen.getByText("link");

    await userEvent.click(screen.getByRole("button", { name: "Spoiler" }));

    expect(screen.getByRole("link", { name: "link" })).toBe(link);
  });

  it.each(["{Enter}", " "])("reveals on %j", async (key) => {
    renderSpoiler();

    await userEvent.tab();
    await userEvent.keyboard(key);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ignores other keys", async () => {
    renderSpoiler();

    await userEvent.tab();
    await userEvent.keyboard("a");

    expect(screen.getByRole("button", { name: "Spoiler" })).toBeDefined();
  });
});
