import type { Env } from "@/lib/env";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const isCI = process.env["CI"] === "true";

const mockEnv = {
  SESSION_SECRET: "test",
  SLACK_CHANNEL: "test-channel",
  SLACK_TOKEN: "test-token",
  UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-redis-token",
  LAST_FM_API_KEY: "test-last-fm-api-key",
} satisfies Env;

const config = defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    include: ["app/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      enabled: isCI,
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["app/**/*.{ts,tsx}"],
    },
    reporters: isCI
      ? ["default", ["junit", { outputFile: "junit.xml" }]]
      : ["default"],
    env: mockEnv,
  },
});

export default config;
