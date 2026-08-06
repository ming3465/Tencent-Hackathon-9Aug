import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vite";

/**
 * Build entries. The game itself is unconditional; the isometric art-direction
 * slice is added only when its page is present.
 *
 * That conditional is what makes the isometric direction a clean one-command
 * rollback — deleting the iso files leaves a config that still builds, with no
 * follow-up edit here. See AGENTS.md, "Dropping the isometric direction".
 */
const input: Record<string, string> = {
  main: resolve(__dirname, "index.html"),
};

const isoPreview = resolve(__dirname, "iso-preview.html");
if (existsSync(isoPreview)) {
  // Separate page on purpose: reviewable on the deployed URL without altering
  // the judged game. Nothing links to it; the campaign never loads it.
  input["iso-preview"] = isoPreview;
}

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    rollupOptions: { input },
    // Phaser and the tightly coupled campaign registries intentionally stay in
    // one lazy scene chunk. Keep a small ceiling above the current ~1.60 MB
    // payload so Vite still warns if that explicit budget is exceeded.
    chunkSizeWarningLimit: 1650,
  },
});
