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

import type { ChatHistoryResult } from "@/actions/chat";
import type { Message, Reaction } from "@/lib/discord/api";
import type { ReactionResult } from "@/lib/reactionResult";
import { server } from "@/mocks/node";

import { Chat } from "./Chat";

const router = vi.hoisted(() => ({
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "",
}));

vi.mock(import("server-only"), () => ({}));
vi.mock(import("next/navigation"), () => ({ useRouter: () => router }));
vi.mock(import("@/actions/chat"), () => ({}));

describe("Chat", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "EventSource",
      class MockEventSource {
        close = vi.fn();
        onopen?: () => void;
        onmessage?: () => void;
        onerror?: () => void;
      },
    );
  });

  const chatElement = (result: ChatHistoryResult, dismissed = false) => (
    <Chat
      history={Promise.resolve(result)}
      tipDismissed={Promise.resolve(dismissed)}
    />
  );

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: "msg-1",
    content: "Test message",
    user: { name: "TestUser", color: "hsl(0 100% 50%)" },
    edited: false,
    timestamp: new Date("2025-01-01T00:00:00.000000+00:00"),
    reactions: [],
    replies: [],
    ...overrides,
  });

  it("renders the simon-bot tip until it is dismissed", async () => {
    await act(async () =>
      render(chatElement({ status: "ok", fetchedAt: 0, messages: [] })),
    );

    expect(
      screen.getByRole("button", { name: "Dismiss tip" }),
    ).toBeInTheDocument();
  });

  it("hides the simon-bot tip once it has been dismissed", async () => {
    await act(async () =>
      render(chatElement({ status: "ok", fetchedAt: 0, messages: [] }, true)),
    );

    expect(
      screen.queryByRole("button", { name: "Dismiss tip" }),
    ).not.toBeInTheDocument();
  });

  it("displays error message when result status is error", async () => {
    const errorResult: ChatHistoryResult = {
      status: "error",
      error: "Failed to fetch",
    };

    await act(async () => render(chatElement(errorResult)));

    expect(
      screen.getByText("Chat is temporarily unavailable :("),
    ).toBeInTheDocument();
  });

  it("renders messages on success", async () => {
    const successResult: ChatHistoryResult = {
      status: "ok",
      fetchedAt: 0,
      messages: [createMessage({ content: "Hello world" })],
    };

    await act(async () => render(chatElement(successResult)));

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  describe("reply flow", () => {
    it("shows reply preview when reply button is clicked", async () => {
      const user = userEvent.setup();
      const message = createMessage({ id: "target-msg", content: "Original" });
      const successResult: ChatHistoryResult = {
        status: "ok",
        fetchedAt: 0,
        messages: [message],
      };

      await act(async () => render(chatElement(successResult)));

      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reply" }));

      expect(screen.getByText("Replying to")).toBeInTheDocument();
    });

    it("shows reply preview for nested message", async () => {
      const user = userEvent.setup();
      const nestedMessage = createMessage({
        id: "nested-msg",
        content: "Nested reply",
      });
      const parentMessage = createMessage({
        id: "parent-msg",
        content: "Parent message",
        replies: [nestedMessage],
      });
      const successResult: ChatHistoryResult = {
        status: "ok",
        fetchedAt: 0,
        messages: [parentMessage],
      };

      await act(async () => render(chatElement(successResult)));

      const replyButtons = screen.getAllByRole("button", { name: "Reply" });
      await user.click(replyButtons[1]!); // Click nested message's reply button

      expect(screen.getByText("Replying to")).toBeInTheDocument();
    });

    it("clears reply when clear button is clicked", async () => {
      const user = userEvent.setup();
      const message = createMessage({ id: "target-msg" });
      const successResult: ChatHistoryResult = {
        status: "ok",
        fetchedAt: 0,
        messages: [message],
      };

      await act(async () => render(chatElement(successResult)));

      await user.click(screen.getByRole("button", { name: "Reply" }));
      expect(screen.getByText("Replying to")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Clear reply" }));
      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();
    });

    it("hides reply preview when message is deleted", async () => {
      const user = userEvent.setup();
      const message = createMessage({
        id: "will-be-deleted",
        content: "Soon gone",
      });
      const initialResult: ChatHistoryResult = {
        status: "ok",
        fetchedAt: 0,
        messages: [message],
      };

      const { rerender } = await act(async () =>
        render(chatElement(initialResult)),
      );

      await user.click(screen.getByRole("button", { name: "Reply" }));
      expect(screen.getByText("Replying to")).toBeInTheDocument();

      // Re-render with messages that don't include the replied-to message
      const updatedResult: ChatHistoryResult = {
        status: "ok",
        fetchedAt: 0,
        messages: [
          createMessage({ id: "different-msg", content: "New message" }),
        ],
      };

      await act(async () => rerender(chatElement(updatedResult)));

      // Reply preview should be hidden since the message no longer exists
      expect(screen.queryByText("Replying to")).not.toBeInTheDocument();
    });
  });

  describe("reactions", () => {
    const thumbs: Reaction[] = [{ emoji: "👍", count: 1, users: [] }];

    // The route saves at 100: a history read at 200 has the reaction, one read at 50 doesn't.
    const SAVED_AT = 100;

    // A new history, as router.refresh would bring.
    const refreshWith = (
      rerender: (ui: React.ReactNode) => void,
      reactions: Reaction[],
      fetchedAt: number | null,
    ) =>
      act(async () =>
        rerender(
          chatElement({
            status: "ok",
            fetchedAt,
            messages: [createMessage({ reactions })],
          }),
        ),
      );

    const renderReactions = (
      reactions: Reaction[],
      fetchedAt: number | null = 0,
    ) =>
      act(async () =>
        render(
          chatElement({
            status: "ok",
            fetchedAt,
            messages: [createMessage({ reactions })],
          }),
        ),
      );

    let requests: { messageId: string; emoji: string; mine: boolean }[];

    beforeEach(() => {
      requests = [];
      router.refresh.mockClear();
    });

    function answer(
      respond: (messageId: string) => Response | Promise<Response>,
    ) {
      server.use(
        http.post("*/api/chat/reactions", async ({ request }) => {
          const body = (await request.json()) as (typeof requests)[number];
          requests.push(body);
          return respond(body.messageId);
        }),
      );
    }

    const ok = () =>
      HttpResponse.json<ReactionResult>({ status: "ok", savedAt: SAVED_AT });

    function holdReaction() {
      const { promise, resolve } = Promise.withResolvers<void>();
      answer(async () => {
        await promise;
        return ok();
      });
      return () => act(async () => resolve());
    }

    it("shows a reaction at once while the server catches up", async () => {
      const settle = holdReaction();
      await renderReactions([...thumbs, { emoji: "🎉", count: 1, users: [] }]);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      const pill = screen.getByRole("button", { name: "👍 2" });
      expect(pill).toHaveAttribute("aria-pressed", "true");
      expect(pill).toHaveAccessibleDescription("You and 1 on Discord");
      expect(screen.getByRole("button", { name: "🎉 1" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await settle();
    });

    it("keeps a pending reaction a refreshed history already has", async () => {
      const settle = holdReaction();
      const { rerender } = await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await act(async () =>
        rerender(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [
              createMessage({
                reactions: [{ emoji: "👍", count: 2, users: [], mine: true }],
              }),
            ],
          }),
        ),
      );

      expect(screen.getByRole("button", { name: "👍 2" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await settle();
    });

    it("keeps a pending removal a refreshed history already has", async () => {
      const settle = holdReaction();
      const { rerender } = await renderReactions([
        { emoji: "👍", count: 1, users: [], mine: true },
      ]);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await act(async () =>
        rerender(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [createMessage()],
          }),
        ),
      );

      expect(
        screen.queryByRole("button", { name: /👍/ }),
      ).not.toBeInTheDocument();
      await settle();
    });

    it("ignores a second pick while the message's reaction is pending", async () => {
      const settle = holdReaction();
      await renderReactions([]);

      const pickTada = async () => {
        const picker = screen.getByRole("toolbar", {
          name: "Pick a reaction",
          hidden: true,
        });
        fireEvent(
          picker,
          Object.assign(new Event("beforetoggle"), { newState: "open" }),
        );
        await userEvent.click(
          within(picker).getByRole("button", { name: "tada", hidden: true }),
        );
      };
      await pickTada();
      await pickTada();

      await waitFor(() => expect(requests).toHaveLength(1));
      expect(screen.getByRole("button", { name: "🎉 1" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await settle();
      expect(requests).toHaveLength(1);
    });

    it("drops a pill at once when the last reaction is taken back", async () => {
      const settle = holdReaction();
      await renderReactions([{ emoji: "👍", count: 1, users: [], mine: true }]);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      expect(
        screen.queryByRole("button", { name: /👍/ }),
      ).not.toBeInTheDocument();
      await settle();
    });

    it("shows a reply's new reaction at once", async () => {
      const settle = holdReaction();
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [
              createMessage({
                replies: [createMessage({ id: "reply-1", content: "Reply" })],
              }),
              createMessage({ id: "msg-2", content: "Untouched" }),
            ],
          }),
        ),
      );

      const picker = screen.getAllByRole("toolbar", {
        name: "Pick a reaction",
        hidden: true,
      })[1]!;
      fireEvent(
        picker,
        Object.assign(new Event("beforetoggle"), { newState: "open" }),
      );
      await userEvent.click(
        within(picker).getByRole("button", { name: "tada", hidden: true }),
      );

      await waitFor(() =>
        expect(requests).toEqual([
          { messageId: "reply-1", emoji: "🎉", mine: true },
        ]),
      );
      expect(screen.getByRole("button", { name: "🎉 1" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await settle();
    });

    it("keeps other messages reactable while one reaction is pending", async () => {
      const settle = holdReaction();
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [
              createMessage({ reactions: thumbs }),
              createMessage({ id: "msg-2", content: "Other" }),
            ],
          }),
        ),
      );

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      expect(screen.getByRole("button", { name: "👍 2" })).toBeDisabled();
      const [busy, free] = screen.getAllByRole("button", {
        name: "Add reaction",
      });
      expect(busy).toBeDisabled();
      expect(free).toBeEnabled();
      await settle();
    });

    it("settles a reaction while another message's is still pending", async () => {
      const { promise, resolve } = Promise.withResolvers<void>();
      answer(async (messageId) => {
        if (messageId === "msg-1") await promise;
        return ok();
      });
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [
              createMessage({ reactions: thumbs }),
              createMessage({
                id: "msg-2",
                content: "Other",
                reactions: thumbs,
              }),
            ],
          }),
        ),
      );

      const [slow, quick] = screen.getAllByRole("button", { name: "👍 1" });
      await userEvent.click(slow!);
      await userEvent.click(quick!);

      const [busy, free] = screen.getAllByRole("button", {
        name: "Add reaction",
      });
      await waitFor(() => expect(free).toBeEnabled());
      expect(busy).toBeDisabled();
      await act(async () => resolve());
    });

    it("shows the saved reaction over any history read before it", async () => {
      answer(() => ok());
      const { rerender } = await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      expect(requests).toEqual([
        { messageId: "msg-1", emoji: "👍", mine: true },
      ]);
      await refreshWith(rerender, thumbs, SAVED_AT - 50);

      const pill = screen.getByRole("button", { name: "👍 2" });
      expect(pill).toHaveAttribute("aria-pressed", "true");
      expect(pill).toBeEnabled();
      // A history read after the save is the truth, as when another tab took it back since.
      await refreshWith(rerender, thumbs, SAVED_AT + 100);
      expect(screen.getByRole("button", { name: "👍 1" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("forgets a saved reaction once a history has it", async () => {
      answer(() => ok());
      const { rerender } = await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      await refreshWith(rerender, thumbs, SAVED_AT + 100);
      await refreshWith(rerender, thumbs, SAVED_AT - 50);

      expect(screen.getByRole("button", { name: "👍 1" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("holds a saved reaction over an undated history only until the next", async () => {
      answer(() => ok());
      const { rerender } = await renderReactions(thumbs, null);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      expect(screen.getByRole("button", { name: "👍 2" })).toBeEnabled();

      await refreshWith(rerender, thumbs, null);
      expect(screen.getByRole("button", { name: "👍 1" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("holds a save Turso couldn't date only until the next history", async () => {
      answer(() =>
        HttpResponse.json<ReactionResult>({ status: "ok", savedAt: null }),
      );
      const { rerender } = await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      expect(screen.getByRole("button", { name: "👍 2" })).toBeEnabled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      await refreshWith(rerender, thumbs, 0);
      expect(screen.getByRole("button", { name: "👍 1" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("keeps one message's error when another's reaction succeeds", async () => {
      answer((messageId) =>
        messageId === "msg-1"
          ? HttpResponse.json<ReactionResult>(
              { status: "error", error: "Rate limit exceeded." },
              { status: 429 },
            )
          : ok(),
      );
      await act(async () =>
        render(
          chatElement({
            status: "ok",
            fetchedAt: 0,
            messages: [
              createMessage({ reactions: thumbs }),
              createMessage({
                id: "msg-2",
                content: "Other",
                reactions: thumbs,
              }),
            ],
          }),
        ),
      );
      const [first, second] = screen.getAllByRole("button", { name: "👍 1" });

      await userEvent.click(first!);
      expect(
        await screen.findByText("Rate limit exceeded."),
      ).toBeInTheDocument();
      await userEvent.click(second!);

      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      expect(screen.getByText("Rate limit exceeded.")).toBeInTheDocument();
    });

    it("asks the route to take back a reaction the visitor has", async () => {
      answer(() => ok());
      await renderReactions([{ emoji: "👍", count: 1, users: [], mine: true }]);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
      expect(requests).toEqual([
        { messageId: "msg-1", emoji: "👍", mine: false },
      ]);
      expect(
        screen.queryByRole("button", { name: /👍/ }),
      ).not.toBeInTheDocument();
    });

    it("reacts again before a refreshed history arrives", async () => {
      answer(() => ok());
      await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "👍 2" })).toBeEnabled(),
      );
      await userEvent.click(screen.getByRole("button", { name: "👍 2" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "👍 1" })).toBeEnabled(),
      );
      expect(requests.map(({ mine }) => mine)).toEqual([true, false]);
    });

    it.each([
      {
        failure: "the server turns it away",
        status: 429,
        error: "Rate limit exceeded.",
      },
      {
        failure: "Discord has too many emoji on it",
        status: 400,
        error: "Discord allows 20 emoji per message",
      },
    ])(
      "puts the reaction back and says why when $failure",
      async ({ status, error }) => {
        answer(() =>
          HttpResponse.json<ReactionResult>(
            { status: "error", error },
            { status },
          ),
        );
        await renderReactions(thumbs);

        await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

        expect(await screen.findByText(error)).toBeInTheDocument();
        const pill = screen.getByRole("button", { name: "👍 1" });
        expect(pill).toHaveAttribute("aria-pressed", "false");
        expect(pill).toBeEnabled();
        // It changed nothing, so there is nothing to refresh.
        expect(router.refresh).not.toHaveBeenCalled();
      },
    );

    it.each([
      {
        failure: "a proxy answers without a result",
        respond: () => new HttpResponse("<html>", { status: 502 }),
        error: "Failed to react to chat message (HTTP 502)",
      },
      {
        failure: "the result isn't one it knows",
        respond: () => HttpResponse.json({ status: "maybe" }),
        error: "Failed to react to chat message (HTTP 200)",
      },
      {
        failure: "the result isn't an object",
        respond: () => HttpResponse.json(null),
        error: "Failed to react to chat message (HTTP 200)",
      },
      {
        failure: "the result lacks the saved state",
        respond: () => HttpResponse.json({ status: "ok" }),
        error: "Failed to react to chat message (HTTP 200)",
      },
      {
        failure: "the error has no message",
        respond: () => HttpResponse.json({ status: "error" }, { status: 500 }),
        error: "Failed to react to chat message (HTTP 500)",
      },
      {
        failure: "the route fails after it may have saved",
        respond: () =>
          HttpResponse.json<ReactionResult>(
            { status: "error", error: "Failed to react to chat message" },
            { status: 500 },
          ),
        error: "Failed to react to chat message",
      },
      {
        failure: "the status says it failed",
        respond: () =>
          HttpResponse.json<ReactionResult>(
            { status: "ok", savedAt: SAVED_AT },
            { status: 500 },
          ),
        error: "Failed to react to chat message (HTTP 500)",
      },
      {
        failure: "the request itself fails",
        respond: () => HttpResponse.error(),
        error: "Failed to react to chat message",
      },
    ])(
      "keeps the reaction until the next history when $failure",
      async ({ respond, error }) => {
        answer(respond);
        const { rerender } = await renderReactions(thumbs);

        await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

        expect(await screen.findByText(error)).toBeInTheDocument();
        const pill = screen.getByRole("button", { name: "👍 2" });
        expect(pill).toHaveAttribute("aria-pressed", "true");
        expect(pill).toBeEnabled();
        // It may have been saved before it failed, so the refreshed history decides.
        expect(router.refresh).toHaveBeenCalledOnce();
        await refreshWith(rerender, thumbs, 0);
        expect(screen.getByRole("button", { name: "👍 1" })).toHaveAttribute(
          "aria-pressed",
          "false",
        );
      },
    );

    it("gives up on a request that hangs past its timeout", async () => {
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(AbortSignal.abort());
      answer(() => ok());
      await renderReactions(thumbs);

      await userEvent.click(screen.getByRole("button", { name: "👍 1" }));

      expect(
        await screen.findByText("Failed to react to chat message"),
      ).toBeInTheDocument();
      expect(timeout).toHaveBeenCalledWith(45_000);
      timeout.mockRestore();
    });

    it("shows the same error again on a repeated failure", async () => {
      answer(() =>
        HttpResponse.json<ReactionResult>(
          { status: "error", error: "Rate limit exceeded." },
          { status: 429 },
        ),
      );
      await renderReactions(thumbs);

      const pill = screen.getByRole("button", { name: "👍 1" });
      await userEvent.click(pill);
      await userEvent.click(
        await screen.findByRole("button", { name: "Close notification" }),
      );
      await waitFor(() =>
        expect(
          screen.queryByText("Rate limit exceeded."),
        ).not.toBeInTheDocument(),
      );
      await userEvent.click(pill);

      expect(
        await screen.findByText("Rate limit exceeded."),
      ).toBeInTheDocument();
    });
  });
});
