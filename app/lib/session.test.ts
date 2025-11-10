import { afterEach, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt } from "./session";

vi.mock(import("server-only"), () => ({}));

vi.mock(import("@/lib/env"), () => ({
  env: {
    SESSION_SECRET: "stub-session-secret",
    SLACK_CHANNEL: "stub-slack-channel",
    SLACK_TOKEN: "stub-slack-token",
  },
}));

describe("session", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("encrypt", () => {
    it("should encrypt a session payload with username", async () => {
      const payload = { username: "testuser" };
      const encrypted = await encrypt(payload);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should create different tokens for different usernames", async () => {
      const token1 = await encrypt({ username: "user1" });
      const token2 = await encrypt({ username: "user2" });

      expect(token1).not.toBe(token2);
    });

    it("should create different tokens each time (due to timestamp)", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const payload = { username: "testuser" };
      const token1 = await encrypt(payload);

      vi.advanceTimersByTime(1000);
      const token2 = await encrypt(payload);

      expect(token1).not.toBe(token2);
    });
  });

  describe("decrypt", () => {
    it("should decrypt a valid session token", async () => {
      const payload = { username: "testuser" };
      const encrypted = await encrypt(payload);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(payload);
    });

    it("should return undefined for undefined session", async () => {
      const result = await decrypt(undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid token", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await decrypt("invalid-token");
      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalledOnce();
    });

    it("should return undefined for tampered token", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const payload = { username: "testuser" };
      const encrypted = await encrypt(payload);
      const tampered = encrypted.slice(0, -5) + "xxxxx";

      const result = await decrypt(tampered);
      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalledOnce();
    });

    it("should validate session schema and reject invalid payload", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const validPayload = { name: "testuser" };
      // @ts-expect-error -- testing invalid payload
      const encrypted = await encrypt(validPayload);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBeUndefined();
      expect(console.error).toHaveBeenCalledOnce();
    });
  });
});
