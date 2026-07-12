/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,svelte}"],
  // src ディレクトリ内の HTML, JS, TS ファイルを対象にする
  theme: {
    extend: {}, // 必要に応じてテーマを拡張
  },
  plugins: [], // 必要に応じてプラグインを追加
}
