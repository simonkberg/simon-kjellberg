import { cookies } from "next/headers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { log } from "@/lib/log";
import { MockCookies } from "@/mocks/headers";

import { decrypt, encrypt, getSession, SessionSchema } from "./session";

vi.mock(import("server-only"), () => ({}));

vi.mock(import("next/headers"), () => ({ cookies: vi.fn() }));

describe("session", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("encrypt", () => {
    it("should encrypt a session payload with username", async () => {
      const payload = SessionSchema.parse({ username: "testuser" });
      const encrypted = await encrypt(payload);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should create different tokens for different usernames", async () => {
      const token1 = await encrypt(SessionSchema.parse({ username: "user1" }));
      const token2 = await encrypt(SessionSchema.parse({ username: "user2" }));

      expect(token1).not.toBe(token2);
    });

    it("should create different tokens each time (due to timestamp)", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const payload = SessionSchema.parse({ username: "testuser" });
      const token1 = await encrypt(payload);

      vi.advanceTimersByTime(1000);
      const token2 = await encrypt(payload);

      expect(token1).not.toBe(token2);
    });
  });

  describe("decrypt", () => {
    it("should decrypt a valid session token", async () => {
      const payload = SessionSchema.parse({ username: "testuser" });
      const encrypted = await encrypt(payload);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(payload);
    });

    it("should return undefined for undefined session", async () => {
      const result = await decrypt(undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid token", async () => {
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      const result = await decrypt("invalid-token");
      expect(result).toBeUndefined();
      expect(logWarnSpy).toHaveBeenCalledOnce();
    });

    it("should return undefined for tampered token", async () => {
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      const payload = SessionSchema.parse({ username: "testuser" });
      const encrypted = await encrypt(payload);
      const tampered = encrypted.slice(0, -5) + "xxxxx";

      const result = await decrypt(tampered);
      expect(result).toBeUndefined();
      expect(logWarnSpy).toHaveBeenCalledOnce();
    });

    it("should validate session schema and reject invalid payload", async () => {
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      // Payload has 'name' instead of 'username' - should fail schema validation
      const invalidPayload = { name: "testuser" };
      // @ts-expect-error -- testing invalid payload
      const encrypted = await encrypt(invalidPayload);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBeUndefined();
      expect(logWarnSpy).toHaveBeenCalledOnce();
    });

    it("should return undefined for expired token", async () => {
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      vi.useFakeTimers({ shouldAdvanceTime: true });
      const payload = SessionSchema.parse({ username: "testuser" });
      const encrypted = await encrypt(payload);

      // Advance time by more than 365 days (token expiration)
      vi.advanceTimersByTime(366 * 24 * 60 * 60 * 1000);

      const result = await decrypt(encrypted);
      expect(result).toBeUndefined();
      expect(logWarnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("getSession", () => {
    it("should return session when valid session cookie exists", async () => {
      const payload = SessionSchema.parse({ username: "testuser" });
      const sessionToken = await encrypt(payload);

      vi.mocked(cookies).mockResolvedValue(
        new MockCookies(new Headers({ cookie: `session=${sessionToken}` })),
      );

      const result = await getSession();

      expect(result).toEqual(payload);
    });

    it("should throw when no session cookie exists", async () => {
      vi.mocked(cookies).mockResolvedValue(new MockCookies(new Headers()));

      await expect(getSession()).rejects.toThrow("No session on the request");
    });

    it("should throw when session cookie is invalid", async () => {
      const logWarnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      vi.mocked(cookies).mockResolvedValue(
        new MockCookies(new Headers({ cookie: "session=invalid-token" })),
      );

      await expect(getSession()).rejects.toThrow("No session on the request");
      expect(logWarnSpy).toHaveBeenCalledOnce();
    });

    it("should throw when session cookie is empty", async () => {
      vi.mocked(cookies).mockResolvedValue(
        new MockCookies(new Headers({ cookie: "session=" })),
      );

      await expect(getSession()).rejects.toThrow("No session on the request");
    });
  });
});
