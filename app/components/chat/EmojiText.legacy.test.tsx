import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmojiText } from "./EmojiText";

vi.hoisted(() => {
  Reflect.deleteProperty(RegExp.prototype, "unicodeSets");
});

describe("EmojiText without the regex v flag", () => {
  it("renders plain text", () => {
    const { container } = render(<EmojiText text="hi 👍" />);

    expect(container).toHaveTextContent("hi 👍");
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  });
});
