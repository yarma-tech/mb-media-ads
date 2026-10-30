import { defineConfig } from "@playwright/test";

const webkit = process.env.STUDIO_UX_BROWSER === "webkit";
export default defineConfig({
  testDir: "./tests/studio",
  timeout: 60000,
  workers: 1,
  use: {
    browserName: webkit ? "webkit" : "chromium",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: webkit
      ? {}
      : {
          executablePath:
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
  },
  reporter: "list",
});
