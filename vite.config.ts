import { resolve } from "node:path";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
    viteSingleFile(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        gascalc: resolve(__dirname, "index.html"),
      },
    },
  },
});
