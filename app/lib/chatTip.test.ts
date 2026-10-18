import { describe, expect, it, vi } from "vitest";

import { mockCookieJar } from "@/mocks/headers";

import { getChatTipDismissed, setChatTipDismissed } from "./chatTip";

vi.mock(import("next/headers"), () => ({ cookies: vi.fn() }));

describe("chatTip", () => {
  describe("getChatTipDismissed", () => {
    it("is true when the cookie is set", async () => {
      mockCookieJar("chatTipDismissed=true");

      await expect(getChatTipDismissed()).resolves.toBe(true);
    });

    it("is false when the cookie is absent", async () => {
      mockCookieJar();

      await expect(getChatTipDismissed()).resolves.toBe(false);
    });

    it("is false for any other cookie value", async () => {
      mockCookieJar("chatTipDismissed=nope");

      await expect(getChatTipDismissed()).resolves.toBe(false);
    });
  });

  describe("setChatTipDismissed", () => {
    it("writes the dismissal cookie", async () => {
      const headers = mockCookieJar();

      await setChatTipDismissed();

      expect(headers.get("set-cookie")).toContain("chatTipDismissed=true");
    });

    it("does not rewrite an already-dismissed cookie", async () => {
      const headers = mockCookieJar("chatTipDismissed=true");

      await setChatTipDismissed();

      expect(headers.get("set-cookie")).toBeNull();
    });
  });
});
