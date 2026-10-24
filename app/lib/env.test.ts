import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { mockEnv } from "@/mocks/env";

import type { Env } from "./env";

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("successful validation", () => {
    it("should parse valid environment variables", async () => {
      const { env } = await import("./env");

      expect(env).toEqual(mockEnv);
    });

    it("should export Env type matching env object", async () => {
      const { env } = await import("./env");

      expectTypeOf<Env>(env).toEqualTypeOf<{
        SESSION_SECRET: string;
        SESSION_SECRET_PREVIOUS?: string | undefined;
        DISCORD_BOT_TOKEN: string;
        DISCORD_GUILD_ID: string;
        DISCORD_CHANNEL_ID: string;
        LAST_FM_API_KEY: string;
        ANTHROPIC_API_KEY: string;
        TURSO_DATABASE_URL: string;
        TURSO_AUTH_TOKEN: string;
      }>();
    });

    it.each([undefined, ""])(
      "should use default SESSION_SECRET in development when it is %j",
      async (value) => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("SESSION_SECRET", value);

        const { env } = await import("./env");

        expect(env.SESSION_SECRET).toBe("unsafe_dev_secret");
      },
    );

    it("should allow missing values when SKIP_ENV_VALIDATION is true", async () => {
      vi.stubEnv("SKIP_ENV_VALIDATION", "true");
      for (const key of Object.keys(mockEnv)) {
        vi.stubEnv(key, undefined);
      }

      const { env } = await import("./env");

      expect(env).toEqual({});
    });

    it("should treat an empty SKIP_ENV_VALIDATION as unset", async () => {
      vi.stubEnv("SKIP_ENV_VALIDATION", "");

      const { env } = await import("./env");

      expect(env).toEqual(mockEnv);
    });

    it("should fill {environment} in TURSO_DATABASE_URL with the Railway environment's database name", async () => {
      vi.stubEnv("TURSO_DATABASE_URL", "libsql://{environment}-org.turso.io");
      vi.stubEnv("RAILWAY_ENVIRONMENT_NAME", "simon.dev-pr-2285");

      const { env } = await import("./env");

      expect(env.TURSO_DATABASE_URL).toBe(
        "libsql://simondev-pr-2285-org.turso.io",
      );
    });

    it("should treat empty values as unset when SKIP_ENV_VALIDATION is true", async () => {
      vi.stubEnv("SKIP_ENV_VALIDATION", "true");
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      const { env } = await import("./env");

      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    });
  });

  describe("validation failures", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should throw when SESSION_SECRET is missing in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("SESSION_SECRET", undefined);

      await expect(import("./env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it.each(Object.keys(mockEnv))(
      "should throw when %s is missing",
      async (key) => {
        vi.stubEnv(key, undefined);

        await expect(import("./env")).rejects.toThrow(
          "Invalid environment variables",
        );
      },
    );

    it("should throw when TURSO_DATABASE_URL is not a valid URL", async () => {
      vi.stubEnv("TURSO_DATABASE_URL", "not-a-url");

      await expect(import("./env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("should throw when TURSO_DATABASE_URL keeps {environment} outside Railway", async () => {
      vi.stubEnv("TURSO_DATABASE_URL", "libsql://{environment}-org.turso.io");

      await expect(import("./env")).rejects.toThrow(
        "Invalid environment variables",
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("RAILWAY_ENVIRONMENT_NAME is unset"),
      );
    });

    it("should throw when ANTHROPIC_API_KEY is empty", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      await expect(import("./env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });
  });
});
