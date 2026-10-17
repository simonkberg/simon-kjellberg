import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { arrowFocus } from "./arrowFocus";

const Buttons = ({ columns }: { columns?: number }) => (
  <div
    role="toolbar"
    tabIndex={-1}
    onKeyDown={(event) =>
      arrowFocus(
        event,
        [...event.currentTarget.querySelectorAll("button")],
        columns,
      )
    }
  >
    {["a", "b", "c", "d"].map((name) => (
      <button key={name}>{name}</button>
    ))}
  </div>
);

const button = (name: string) => screen.getByRole("button", { name });

describe("arrowFocus", () => {
  it("moves up and down a list, leaving left and right to the browser", async () => {
    const user = userEvent.setup();
    render(<Buttons />);
    button("b").focus();

    await user.keyboard("{ArrowRight}{ArrowLeft}");
    expect(button("b")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(button("c")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(button("b")).toHaveFocus();
  });

  it("moves across a grid by column and by row", async () => {
    const user = userEvent.setup();
    render(<Buttons columns={2} />);
    button("a").focus();

    await user.keyboard("{ArrowRight}");
    expect(button("b")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(button("d")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(button("c")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(button("a")).toHaveFocus();
  });

  it("leaves an arrow past the ends to the browser", () => {
    render(<Buttons />);
    button("a").focus();

    expect(fireEvent.keyDown(button("a"), { key: "ArrowUp" })).toBe(true);
    expect(button("a")).toHaveFocus();
  });
});
