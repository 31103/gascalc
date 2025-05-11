# Tech Context

## 使用技術

- **フロントエンド:**
  - HTML5: アプリケーションの構造定義。セマンティックな要素の利用を推進。
  - CSS3: スタイリング。TailwindCSS をフレームワークとして利用。
  - TypeScript: DOM 操作、イベント処理、計算ロジック、状態管理。
- **CSSフレームワーク:**
  - TailwindCSS:
    ユーティリティファーストのCSSフレームワーク。カスタムコンポーネントクラスも一部利用。
- **JavaScript/TypeScriptランタイム:**
  - Deno: TypeScript および JavaScript の実行環境。タスクランナーとしても利用。
- **ビルドツール:**
  - esbuild: TypeScript のバンドルと minify に使用 (Deno経由で利用)。

## 開発環境

- **依存関係:**
  - `deno.jsonc` の `imports` で管理。主に TailwindCSS CLI
    (`@tailwindcss/cli`)。
- **ビルドプロセス:**
  - `deno task build` コマンドで実行。
  -
    1. CSSビルド: `deno task build:css` (TailwindCSS CLI
       を使用し、`src/styles/input.css` から `dist/.temp/styles.css`
       を生成・minify)。
  -
    2. JSバンドルとHTML生成: `deno task build:html` (`build.ts` を実行)。
    - `src/main.ts` を esbuild でバンドル・minify (メモリ上で処理)。
    - `src/index.html` をテンプレートとして、生成されたCSSとJSをインライン展開し
      `dist/gascalc.html` を出力。
  -
    3. 一時ファイル削除: `deno task clean:temp` (`scripts/clean_temp.ts`
       を実行し、`dist/.temp` を削除、クロスプラットフォーム対応)。
- **開発用サーバー/Watchモード:**
  - `deno task dev`: TailwindCSS の watch
    モードを起動し、CSSの変更をリアルタイムに `src/styles/output.css` (開発用)
    に反映。
- **推奨ツール:** テキストエディタ (VS Code など)、Web ブラウザ
  (開発者ツールを含む)。

## 実行環境

- **必須:** モダンな Web ブラウザ (Chrome, Firefox, Safari, Edge など)。
- **推奨:** JavaScript が有効になっていること。

## デプロイメント

- **方式:** 静的ファイルホスティング。
- **プラットフォーム例:** GitHub Pages, Netlify, Vercel, または任意の Web
  サーバー。
- **手順:** ビルド成果物である `dist/gascalc.html`
  ファイルをホスティング環境にアップロードする。

## 技術的制約

- **データ永続性:** データはブラウザのメモリ上にのみ保持され、永続化されない。
- **クライアントサイド依存:**
  すべての処理はユーザーのブラウザで行われるため、パフォーマンスはクライアント環境に依存する。
- **外部連携:** 外部 API やデータベースとの連携機能はない。
