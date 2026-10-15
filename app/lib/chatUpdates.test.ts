// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type ChangeListener, listen } from "@/lib/discord/gateway";
import { resetGlobal } from "@/lib/global";
import { log } from "@/lib/log";

import {
  onChatRefresh,
  refreshChat,
  refreshChatUnlessEchoed,
  startChatUpdates,
} from "./chatUpdates";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("@/lib/discord/gateway"), () => ({ listen: vi.fn() }));

const clear = { messageIds: ["1"], emoji: null };

beforeEach(() => {
  vi.useFakeTimers();
  resetGlobal("simon.dev/chat-updates");
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function startAndGetListener(
  applyClear: () => Promise<void> = () => Promise.resolve(),
): ChangeListener {
  startChatUpdates(applyClear);
  const listener = vi.mocked(listen).mock.calls[0]?.[0];
  if (!listener) throw new Error("not listening");
  return listener;
}

describe("refreshChat", () => {
  it("calls every subscriber until it unsubscribes", () => {
    const callback = vi.fn();
    const unsubscribe = onChatRefresh(callback);

    refreshChat();
    unsubscribe();
    refreshChat();

    expect(callback).toHaveBeenCalledOnce();
  });

  it("logs a throwing subscriber and still calls the rest", () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const callback = vi.fn();
    onChatRefresh(() => {
      throw new Error("boom");
    });
    onChatRefresh(callback);

    refreshChat();

    expect(log.error).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });
});

describe("refreshChatUnlessEchoed", () => {
  it("refreshes once when Discord echoes the change", async () => {
    const callback = vi.fn();
    onChatRefresh(callback);
    const listener = startAndGetListener();

    refreshChatUnlessEchoed();
    listener({});
    await vi.advanceTimersByTimeAsync(5000);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("refreshes anyway when Discord sends no echo", async () => {
    const callback = vi.fn();
    onChatRefresh(callback);

    refreshChatUnlessEchoed();
    await vi.advanceTimersByTimeAsync(2999);
    expect(callback).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("doesn't refresh for a cancelled change", async () => {
    const callback = vi.fn();
    onChatRefresh(callback);

    refreshChatUnlessEchoed()();
    await vi.advanceTimersByTimeAsync(5000);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("startChatUpdates", () => {
  it("refreshes on a channel change", () => {
    const callback = vi.fn();
    onChatRefresh(callback);

    startAndGetListener()({});

    expect(callback).toHaveBeenCalledOnce();
  });

  it("refreshes once a clear is applied", async () => {
    const callback = vi.fn();
    onChatRefresh(callback);
    const applied = Promise.withResolvers<void>();
    const applyClear = vi.fn(() => applied.promise);

    startAndGetListener(applyClear)({ clear });
    await vi.advanceTimersByTimeAsync(0);
    expect(applyClear).toHaveBeenCalledWith(clear);
    expect(callback).not.toHaveBeenCalled();

    applied.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("logs a failed clear and still refreshes", async () => {
    vi.spyOn(log, "error").mockImplementation(() => {});
    const callback = vi.fn();
    onChatRefresh(callback);

    startAndGetListener(() => Promise.reject(new Error("down")))({ clear });
    await vi.advanceTimersByTimeAsync(0);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "Failed to clear reactions",
    );
    expect(callback).toHaveBeenCalledOnce();
  });
});
