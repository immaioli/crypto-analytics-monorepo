import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.e2e-spec.ts"],
    globals: true,
    root: "./",
    env: {
      NODE_ENV: "test",
      COINGECKO_BASE_URL: "https://api.coingecko.com/api/v3",
    },
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
