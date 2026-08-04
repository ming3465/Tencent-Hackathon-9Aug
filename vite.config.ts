import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    // Phaser and the tightly coupled campaign registries intentionally stay in
    // one lazy scene chunk. Keep a small ceiling above the current ~1.60 MB
    // payload so Vite still warns if that explicit budget is exceeded.
    chunkSizeWarningLimit: 1650,
  },
});
