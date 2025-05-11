import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
// import { copy } from "https://deno.land/std@0.224.0/fs/copy.ts"; // 不要になったのでコメントアウトまたは削除
import { encodeBase64 } from "jsr:@std/encoding/base64"; // JSRからインポートし、関数名を修正
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts"; // Deno 用 esbuild プラグイン

const SRC_DIR = "src";
const DIST_DIR = "dist";
const TEMP_DIR = `${DIST_DIR}/.temp`; // CSS の一時ファイル用
const HTML_TEMPLATE_PATH = `${SRC_DIR}/index.html`;
const ENTRY_POINT_TS = `${SRC_DIR}/main.ts`;
const TEMP_CSS_PATH = `${TEMP_DIR}/styles.css`;
const OUTPUT_HTML_PATH = `${DIST_DIR}/gascalc.html`;

async function build() {
  console.log("Starting build process...");

  try {
    // --- 0. Ensure directories exist ---
    await ensureDir(DIST_DIR);
    await ensureDir(TEMP_DIR);
    // await ensureDir(`${DIST_DIR}/assets/fonts`); // 不要
    // アセットのコピー処理も不要になったため削除

    // --- 1. Build CSS (using deno task) ---
    console.log("Building CSS (Tailwind)...");
    const cssProcess = new Deno.Command("deno", {
      args: ["task", "build:css"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const cssStatus = await cssProcess.output();
    if (!cssStatus.success) {
      throw new Error(`CSS build failed with code: ${cssStatus.code}`);
    }
    console.log("CSS build successful.");

    // --- 2. Bundle JS using esbuild ---
    console.log("Bundling JavaScript using esbuild...");
    const result = await esbuild.build({
      plugins: [...denoPlugins()], // Deno 用プラグインを使用
      entryPoints: [ENTRY_POINT_TS],
      outfile: ":memory:", // メモリ上に出力（ファイルには書き出さない）
      bundle: true,
      format: "esm", // ES Module 形式で出力
      minify: true, // コードを圧縮
      write: false, // メモリ上でのみ処理し、ファイルには書き出さない
    });

    // バンドル結果の取得 (result.outputFiles は write: false の場合のみ存在)
    if (!result.outputFiles || result.outputFiles.length === 0) {
        throw new Error("esbuild did not produce an output file in memory.");
    }
    const jsContent = new TextDecoder().decode(result.outputFiles[0].contents);
    console.log("JavaScript bundle successful (in memory).");

    // --- 3. Read HTML template, Tailwind CSS, and Icon Font CSS/Data ---
    console.log("Reading HTML template, Tailwind CSS, and Icon Font data...");
    const htmlTemplate = await Deno.readTextFile(HTML_TEMPLATE_PATH);
    const tailwindCssContent = await Deno.readTextFile(TEMP_CSS_PATH);

    // Read icon font CSS
    const iconFontCssPath = `${SRC_DIR}/assets/fonts/material-symbols.css`;
    let iconFontCssContent = await Deno.readTextFile(iconFontCssPath);

    // Read and Base64 encode icon font file
    const iconFontFilePath = `${SRC_DIR}/assets/fonts/MaterialSymbolsOutlined.ttf`;
    // ファイルが存在するか確認してから読み込む (オプション)
    try {
        await Deno.stat(iconFontFilePath); // ファイルの存在確認
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            console.warn(`Icon font file not found at ${iconFontFilePath}. Icons might not be displayed.`);
            // アイコンフォントCSSのインジェクションをスキップするなどの処理も可能
        } else {
            throw e; // その他のエラーは再スロー
        }
    }
    const fontFileContent = await Deno.readFile(iconFontFilePath);
    const base64FontData = encodeBase64(fontFileContent);
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
    // Remove development-only links/scripts (if any were missed or added back)
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
    await Deno.writeTextFile(OUTPUT_HTML_PATH, outputHtml);
    console.log("Final HTML written successfully.");

    // --- 6. Clean up temporary directory (handled by main build task) ---
    // The clean:temp task is part of the main 'build' task in deno.jsonc

    console.log("Build process finished successfully!");

  } catch (error) {
    console.error("Build failed:", error);
    // esbuild を停止 (必要な場合)
    // esbuild.stop(); // finallyブロックで確実に呼ばれるため、ここでは不要
    Deno.exit(1);
  } finally {
      // ビルド成功・失敗に関わらず esbuild プロセスを停止
      esbuild.stop();
  }
}

// Run the build function
if (import.meta.main) {
  await build();
}
