import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defaultExclude, defineConfig } from "vitest/config";

const config = defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    exclude: [...defaultExclude, "**/.worktrees/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});

export default config;
