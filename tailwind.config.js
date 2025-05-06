/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts}", // src ディレクトリ内の HTML, JS, TS ファイルを対象にする
    "./src/styles/output.css", // 開発用CSSファイルもスキャン対象に追加
  ],
  theme: {
    extend: {}, // 必要に応じてテーマを拡張
  },
  plugins: [], // 必要に応じてプラグインを追加
}