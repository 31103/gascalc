import { bundle } from "https://deno.land/x/emit@0.7.0/mod.ts";
import { exec } from "https://deno.land/x/exec@0.0.5/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";

const SRC_DIR = "./src";
const DIST_DIR = "./dist";
const OUT_FILE = "gascalc.html";

/**
 * Run Tailwind CSS to generate processed CSS
 */
async function processCss(): Promise<string> {
  await exec("npx tailwindcss -i ./src/styles.css -o ./temp/styles.processed.css --minify");
  return await Deno.readTextFile("./temp/styles.processed.css");
}

/**
 * Bundle TypeScript files
 */
async function bundleJs(): Promise<string> {
  const result = await bundle(path.join(SRC_DIR, "app.ts"), {
    compilerOptions: {
      lib: ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"],
    },
  });

  const bundleText = result.code;
  return bundleText;
}

/**
 * Create standalone HTML file with inlined CSS and JS
 */
async function createStandaloneHtml(css: string, js: string): Promise<string> {
  const htmlTemplate = await Deno.readTextFile(path.join(SRC_DIR, "index.html"));

  // Replace CSS and JS references with inlined content
  let processedHtml = htmlTemplate.replace(
    '<link rel="stylesheet" href="styles.css">',
    `<style>${css}</style>`
  );
  
  processedHtml = processedHtml.replace(
    '<script type="module" src="app.js"></script>',
    `<script type="module">${js}</script>`
  );

  return processedHtml;
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  console.log("🚀 Starting build process...");
  
  // Create temp and dist directories if they don't exist
  try {
    await Deno.mkdir("./temp", { recursive: true });
    await Deno.mkdir(DIST_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  console.log("🎨 Processing CSS with Tailwind...");
  const css = await processCss();

  console.log("📦 Bundling JavaScript...");
  const js = await bundleJs();

  console.log("🔨 Creating standalone HTML...");
  const html = await createStandaloneHtml(css, js);

  console.log("💾 Writing output file...");
  await Deno.writeTextFile(path.join(DIST_DIR, OUT_FILE), html);

  console.log(`✅ Build complete! Output: ${path.join(DIST_DIR, OUT_FILE)}`);

  // Clean up temp directory
  try {
    await Deno.remove("./temp", { recursive: true });
  } catch (error) {
    console.warn("Warning: Could not clean up temp directory", error);
  }
}

// Run build process
if (import.meta.main) {
  build().catch((err) => {
    console.error("❌ Build failed:", err);
    Deno.exit(1);
  });
}