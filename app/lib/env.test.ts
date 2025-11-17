import { describe, expect, expectTypeOf, it } from "vitest";

import type { Env } from "./env";
import { env } from "./env";

describe("env", () => {
  describe("environment variable parsing", () => {
    it("should successfully parse all environment variables from vitest.config.ts", () => {
      // These values come from mockEnv in vitest.config.ts
      expect(env.SESSION_SECRET).toBe("test");
      expect(env.SLACK_CHANNEL).toBe("test-channel");
      expect(env.SLACK_TOKEN).toBe("test-token");
      expect(env.UPSTASH_REDIS_REST_URL).toBe("https://test.upstash.io");
      expect(env.UPSTASH_REDIS_REST_TOKEN).toBe("test-redis-token");
      expect(env.LAST_FM_API_KEY).toBe("test-last-fm-api-key");
    });

    it("should have all required environment variables defined", () => {
      expect(env).toHaveProperty("SESSION_SECRET");
      expect(env).toHaveProperty("SLACK_CHANNEL");
      expect(env).toHaveProperty("SLACK_TOKEN");
      expect(env).toHaveProperty("UPSTASH_REDIS_REST_URL");
      expect(env).toHaveProperty("UPSTASH_REDIS_REST_TOKEN");
      expect(env).toHaveProperty("LAST_FM_API_KEY");
    });

    it("should validate UPSTASH_REDIS_REST_URL is a valid URL", () => {
      expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https?:\/\//);
      expect(() => new URL(env.UPSTASH_REDIS_REST_URL)).not.toThrow();
    });
  });

  describe("TypeScript types", () => {
    it("should have correct TypeScript types for all environment variables", () => {
      expectTypeOf(env.SESSION_SECRET).toBeString();
      expectTypeOf(env.SLACK_CHANNEL).toBeString();
      expectTypeOf(env.SLACK_TOKEN).toBeString();
      expectTypeOf(env.UPSTASH_REDIS_REST_URL).toBeString();
      expectTypeOf(env.UPSTASH_REDIS_REST_TOKEN).toBeString();
      expectTypeOf(env.LAST_FM_API_KEY).toBeString();
    });

    it("should export Env type that matches env object structure", () => {
      type TestEnv = typeof env;

      expectTypeOf<TestEnv>().toEqualTypeOf<{
        SESSION_SECRET: string;
        SLACK_CHANNEL: string;
        SLACK_TOKEN: string;
        UPSTASH_REDIS_REST_URL: string;
        UPSTASH_REDIS_REST_TOKEN: string;
        LAST_FM_API_KEY: string;
      }>();
    });

    it("should have Env type export matching the env object type", () => {
      expectTypeOf<Env>().toEqualTypeOf<typeof env>();
    });
  });

  describe("environment variable constraints", () => {
    it("should have non-empty string values for all variables", () => {
      expect(env.SESSION_SECRET.length).toBeGreaterThan(0);
      expect(env.SLACK_CHANNEL.length).toBeGreaterThan(0);
      expect(env.SLACK_TOKEN.length).toBeGreaterThan(0);
      expect(env.UPSTASH_REDIS_REST_URL.length).toBeGreaterThan(0);
      expect(env.UPSTASH_REDIS_REST_TOKEN.length).toBeGreaterThan(0);
      expect(env.LAST_FM_API_KEY.length).toBeGreaterThan(0);
    });
  });
});
