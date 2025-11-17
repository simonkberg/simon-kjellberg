import type { Env } from "@/lib/env";

export const mockEnv = {
  SESSION_SECRET: "test",
  SLACK_CHANNEL: "test-channel",
  SLACK_TOKEN: "test-token",
  UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-redis-token",
  LAST_FM_API_KEY: "test-last-fm-api-key",
} satisfies Env;
