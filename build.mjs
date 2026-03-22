import { mkdir, readFile, writeFile, stat, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import esbuild from "esbuild";

const SRC_DIR = "src";
const DIST_DIR = "dist";
const TEMP_DIR = `${DIST_DIR}/.temp`;
const HTML_TEMPLATE_PATH = `${SRC_DIR}/index.html`;
const ENTRY_POINT_TS = `${SRC_DIR}/main.ts`;
const TEMP_CSS_PATH = `${TEMP_DIR}/styles.css`;
const OUTPUT_HTML_PATH = `${DIST_DIR}/gascalc.html`;

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function encodeBase64(buffer) {
  return Buffer.from(buffer).toString("base64");
}

async function build() {
  console.log("Starting build process...");

  try {
    // --- 0. Ensure directories exist ---
    await ensureDir(DIST_DIR);
    await ensureDir(TEMP_DIR);

    // --- 1. Build CSS (already done via npm run build:css, verify it exists) ---
    try {
      await stat(TEMP_CSS_PATH);
      console.log("CSS build verified.");
    } catch {
      console.error("CSS file not found. Run 'npm run build:css' first.");
      process.exit(1);
    }

    // --- 2. Bundle JS using esbuild ---
    console.log("Bundling JavaScript using esbuild...");
    const result = await esbuild.build({
      entryPoints: [ENTRY_POINT_TS],
      bundle: true,
      format: "esm",
      minify: true,
      write: false,
    });

    if (!result.outputFiles || result.outputFiles.length === 0) {
      throw new Error("esbuild did not produce an output file in memory.");
    }
    const jsContent = new TextDecoder().decode(result.outputFiles[0].contents);
    console.log("JavaScript bundle successful (in memory).");

    // --- 3. Read HTML template, Tailwind CSS, and Icon Font CSS/Data ---
    console.log("Reading HTML template, Tailwind CSS, and Icon Font data...");
    const htmlTemplate = await readFile(HTML_TEMPLATE_PATH, "utf-8");
    const tailwindCssContent = await readFile(TEMP_CSS_PATH, "utf-8");

    // Read icon font CSS
    const iconFontCssPath = `${SRC_DIR}/assets/fonts/material-symbols.css`;
    let iconFontCssContent = await readFile(iconFontCssPath, "utf-8");

    // Read and Base64 encode icon font file
    const iconFontFilePath = `${SRC_DIR}/assets/fonts/MaterialSymbolsOutlined.ttf`;
    try {
      await stat(iconFontFilePath);
    } catch (e) {
      if (e.code === "ENOENT") {
        console.warn(`Icon font file not found at ${iconFontFilePath}. Icons might not be displayed.`);
      } else {
        throw e;
      }
    }
    const fontFileBuffer = await readFile(iconFontFilePath);
    const base64FontData = encodeBase64(fontFileBuffer);
    const fontDataUri = `data:font/ttf;base64,${base64FontData}`;

    // Replace font file path in CSS with data URI
    iconFontCssContent = iconFontCssContent.replace(
      /url\(\s*['"]?(\.\/MaterialSymbolsOutlined\.ttf)['"]?\s*\)/g,
      `url(${fontDataUri})`
    );
    console.log("Files and font data read successfully.");

    // --- 4. Inject CSS (Tailwind and Icon Font) and JS into HTML ---
    console.log("Injecting CSS and JS into HTML...");
    let outputHtml = htmlTemplate.replace(
      /<!-- TailwindCSS はビルド時にここにインライン展開されます -->/,
      `<style>\n${tailwindCssContent}\n</style>`
    );

    // Inject icon font CSS (remove existing link first, then inject)
    outputHtml = outputHtml.replace(/<link href="\.\/assets\/fonts\/material-symbols\.css" rel="stylesheet">\n?/g, '');
    outputHtml = outputHtml.replace(
      /<\/head>/,
      `<style>\n${iconFontCssContent}\n</style>\n</head>`
    );

    outputHtml = outputHtml.replace(
      /<!-- JavaScript はビルド時にここにインライン展開されます -->/,
      `<script type="module">\n${jsContent}\n</script>`
    );

    // Remove development-only links/scripts
    outputHtml = outputHtml.replace(/<!-- <link rel="stylesheet" href="styles\/output.css"> -->.*?\n?/g, '');
    outputHtml = outputHtml.replace(/<!-- <script type="module" src="main.ts"><\/script> -->.*?\n?/g, '');

    // --- Add License Information as HTML comment ---
    const licenseComment = `
<!--
Material Symbols (Apache License Version 2.0)
https://fonts.google.com/icons?selected=Material+Symbols+Outlined:settings:FILL@0;wght@400;GRAD@0;opsz@48
Google Fonts - Apache License, version 2.0: https://www.apache.org/licenses/LICENSE-2.0.html
-->
`;
    outputHtml = outputHtml.replace(/<\/body>/, `${licenseComment}\n</body>`);
    console.log("Injection complete.");

    // --- 5. Write final HTML ---
    console.log(`Writing final HTML to ${OUTPUT_HTML_PATH}...`);
    await writeFile(OUTPUT_HTML_PATH, outputHtml, "utf-8");
    console.log("Final HTML written successfully.");

    console.log("Build process finished successfully!");

  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

await build();
