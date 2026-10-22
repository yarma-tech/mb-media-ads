import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: [
      "lib/social-ads/**/*.test.ts",
      "lib/campaign-decks/**/*.test.ts",
      "lib/campaign-decks/**/*.test.tsx",
      "lib/campaign-studio/**/*.test.ts",
    ],
    environment: "node",
  },
});
