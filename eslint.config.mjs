import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Mockups et logos: pixels d'origine, sans optimisation ni recadrage.
  {
    files: [
      "app/social/_components/previews/*.tsx",
      "app/social/_components/BrandSettings.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([
    ".next/**",
    ".next-studio/**",
    "node_modules/**",
    ".codex/**",
    "supabase/.temp/**",
  ]),
]);
