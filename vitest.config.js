import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    setupFiles: ["tests/setup.js"],
    fileParallelism: false, // integration test files share one database, so run files one after another
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
