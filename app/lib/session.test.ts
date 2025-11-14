import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt } from "./session";

vi.mock(import("server-only"), () => ({}));

vi.mock(import("@/lib/env"), () => ({
  env: {
    SESSION_SECRET: "stub-session-secret",
    SLACK_CHANNEL: "stub-slack-channel",
    SLACK_TOKEN: "stub-slack-token",
    UPSTASH_REDIS_REST_URL: "https://stub-redis-url.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "stub-redis-token",
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
    let consoleErrorSpy: Mock<Console["error"]>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

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
      const result = await decrypt("invalid-token");
      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
    });

    it("should return undefined for tampered token", async () => {
      const payload = { username: "testuser" };
      const encrypted = await encrypt(payload);
      const tampered = encrypted.slice(0, -5) + "xxxxx";

      const result = await decrypt(tampered);
      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
    });

    it("should validate session schema and reject invalid payload", async () => {
      // Payload has 'name' instead of 'username' - should fail schema validation
      const invalidPayload = { name: "testuser" };
      // @ts-expect-error -- testing invalid payload
      const encrypted = await encrypt(invalidPayload);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
    });

    it("should return undefined for expired token", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const payload = { username: "testuser" };
      const encrypted = await encrypt(payload);

      // Advance time by more than 365 days (token expiration)
      vi.advanceTimersByTime(366 * 24 * 60 * 60 * 1000);

      const result = await decrypt(encrypted);
      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
