import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";

import { server } from "@/mocks/node";

import { ChatInput } from "./ChatInput";

vi.mock(import("@/actions/chat"), () => ({ postChatMessage: vi.fn() }));

// A file of its own, since the first fetch's result is kept for the page's lifetime.
it("falls back to the reactions when the emoji can't load", async () => {
  server.use(http.get("*/api/emoji", () => HttpResponse.error()));
  const user = userEvent.setup({ delay: null });
  render(<ChatInput replyToId={null} setReplyToId={vi.fn()} />);

  await user.type(screen.getByRole("combobox"), ":sku");

  expect(await screen.findByRole("option", { name: "skull" })).toBeVisible();
});
