import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
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
    },
});
