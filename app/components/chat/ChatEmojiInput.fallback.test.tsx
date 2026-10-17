import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";

import { server } from "@/mocks/node";

import { ChatInput } from "./ChatInput";

vi.mock(import("@/actions/chat"), () => ({ postChatMessage: vi.fn() }));

// A file of its own, since the fetched set is kept for the page's lifetime.
it("falls back to the reactions when the emoji can't load, and retries on the next focus", async () => {
  server.use(
    http.get("*/api/emoji", () =>
      HttpResponse.json({ error: "Bad gateway" }, { status: 502 }),
    ),
  );
  const user = userEvent.setup({ delay: null });
  render(
    <ChatInput replyToId={null} setReplyToId={vi.fn()}>
      <button type="button">Next</button>
    </ChatInput>,
  );
  const input = screen.getByRole("combobox");

  await user.type(input, ":sku");
  expect(await screen.findByRole("option", { name: "skull" })).toBeVisible();

  server.use(
    http.get("*/api/emoji", () =>
      HttpResponse.json([["☠️", "skull_crossbones"]]),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(input);
  await user.keyboard("l");

  expect(
    await screen.findByRole("option", { name: "skull_crossbones" }),
  ).toBeVisible();
});
