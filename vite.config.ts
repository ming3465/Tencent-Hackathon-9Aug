import { existsSync, readdirSync } from "node:fs";
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

const nanoProof = resolve(__dirname, "nano.html");
if (existsSync(nanoProof)) {
  // The on-device model, shown at a size a room can read. Same conditional
  // pattern as above, so `rm nano.html src/nano.ts` removes it completely.
  input.nano = nanoProof;
}

/**
 * Which portrait files actually exist, read once at build time.
 *
 * Without this the runtime had to discover them by trying to load each one,
 * which meant a 404 in the console for every character that has no portrait —
 * and today that is all of them. The drop-a-file-in contract is unchanged:
 * this list is regenerated on every build, so adding `aunty-mei.webp` still
 * just works. It only stops the browser asking for files nobody shipped.
 *
 * Dev note: the list is read when Vite starts, so adding a portrait during
 * `npm run dev` needs a restart to be picked up.
 */
function portraitManifest(): readonly string[] {
  const dir = resolve(__dirname, "public/assets/portraits");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => /\.(webp|png)$/i.test(name));
}

export default defineConfig({
  define: {
    __PORTRAIT_FILES__: JSON.stringify(portraitManifest()),
  },
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
