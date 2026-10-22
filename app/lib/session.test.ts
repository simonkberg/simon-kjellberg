import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

import { log } from "@/lib/log";
import { mockCookieJar } from "@/mocks/headers";

import { decrypt, encrypt, getSession, SessionSchema } from "./session";

vi.mock(import("next/headers"), () => ({ cookies: vi.fn() }));
vi.mock(import("@/lib/env"), async (importOriginal) => {
  const { env } = await importOriginal();
  return { env: { ...env, SESSION_SECRET_PREVIOUS: "previous_secret" } };
});

function signWith(secret: string) {
  return new SignJWT({ username: "testuser" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));
}

describe("session", () => {
  describe("encrypt", () => {
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
      const result = await decrypt("invalid-token");
      expect(result).toBeUndefined();
      expect(log.warn).toHaveBeenCalledOnce();
    });

    it("accepts a token signed with the previous secret", async () => {
      expect(await decrypt(await signWith("previous_secret"))).toEqual({
        username: "testuser",
      });
    });

    it("logs a token signed with another secret as an error", async () => {
      expect(await decrypt(await signWith("another_secret"))).toBeUndefined();
      expect(log.error).toHaveBeenCalledOnce();
      expect(log.warn).not.toHaveBeenCalled();
    });

    it("should validate session schema and reject invalid payload", async () => {
      // @ts-expect-error -- 'name' instead of 'username' fails the schema
      const encrypted = await encrypt({ name: "testuser" });
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBeUndefined();
      expect(log.warn).toHaveBeenCalledOnce();
    });

    it("should return undefined for expired token", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const payload = SessionSchema.parse({ username: "testuser" });
      const encrypted = await encrypt(payload);

      vi.advanceTimersByTime(366 * 24 * 60 * 60 * 1000);

      const result = await decrypt(encrypted);
      expect(result).toBeUndefined();
      expect(log.warn).toHaveBeenCalledOnce();
    });
  });

  describe("getSession", () => {
    it("should return session when valid session cookie exists", async () => {
      const payload = SessionSchema.parse({ username: "testuser" });
      mockCookieJar(`session=${await encrypt(payload)}`);

      const result = await getSession();

      expect(result).toEqual(payload);
    });

    it.each([undefined, "session=invalid-token"])(
      "should throw when the session cookie is %j",
      async (cookie) => {
        mockCookieJar(cookie);

        await expect(getSession()).rejects.toThrow("No session on the request");
      },
    );
  });
});
