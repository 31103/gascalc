# 技術コンテキスト (Tech Context)

## 主要技術

- **TypeScript**: 静的型付けにより、コードの堅牢性と開発効率を向上。
- **Deno**: モダンで安全なJavaScript/TypeScriptランタイム。
  - ビルドツール、タスクランナー、リンター、フォーマッターとしても利用。
  - `deno.jsonc` でプロジェクト設定とタスクを管理。
- **TailwindCSS**: ユーティリティファーストのCSSフレームワーク。
  - `src/styles/input.css` を入力とし、ビルド時に `dist/.temp/styles.css`
    を生成（minify含む）。
  - 最終的にはHTMLファイルにインライン化される。
- **Material Design 3**: Googleのデザインシステム。UI/UXの設計原則として採用。
  - カラースキーム、タイポグラフィ、コンポーネントのスタイルなどを定義。
- **Material Symbols**: Google提供のアイコンフォント。
  - `.ttf` 形式のフォントファイルと関連CSS (`src/assets/fonts/`)
    をローカルに配置。
  - ビルド時にフォントデータをBase64エンコードし、CSSと共にHTMLファイルにインライン化。
- **esbuild**: 高速なJavaScriptバンドラ。Deno経由 (`deno-esbuild` プラグイン)
  で使用。
  - `src/main.ts`
    をエントリーポイントとし、依存関係を解決して単一のJavaScriptコードを生成（minify含む）。
  - 最終的にはHTMLファイルにインライン化される。

## ビルドとデプロイ

- **ビルドスクリプト (`build.ts`)**: Denoで記述されたカスタムビルドスクリプト。
  - CSSのビルド (TailwindCSS)。
  - JavaScriptのバンドルとminify (esbuild)。
  - アイコンフォントと関連CSSの読み込み、Base64エンコード、データURI化。
  - HTMLテンプレートへのCSS、JavaScript、アイコンフォントCSSのインライン展開。
  - ライセンス情報のHTMLコメントとしての挿入。
  - 最終的な単一HTMLファイル (`dist/gascalc.html`) の生成。
- **単一HTMLファイル**:
  すべてのアセット（CSS、JavaScript、アイコンフォント）を埋め込んだ単一のHTMLファイルとして成果物を提供。
  - オフラインでの利用が可能。
  - 配布と利用が容易。
- **Denoタスク**: `deno.jsonc` で定義されたタスク (`deno task build`,
  `deno task dev` など) を使用してビルドや開発を行う。

## 開発環境

- **Deno**: ランタイムとして必須。
- **コードエディタ**: VSCodeなど、TypeScriptとDenoをサポートするエディタ。
  - Deno拡張機能の利用を推奨。
- **TailwindCSS IntelliSense**:
  VSCode拡張機能など、TailwindCSSのクラス名補完があると開発効率が向上。

## 技術的制約・考慮事項

- **ブラウザ互換性**: モダンブラウザを対象。ES
  Module形式のJavaScript、CSS変数などを使用。
- **パフォーマンス**:
  単一HTMLファイルにすべてを埋め込むため、初期ロードサイズが大きくなる可能性がある。ただし、ファイルサイズは現状では許容範囲。
- **オフライン利用**:
  インターネット接続なしでの利用が前提のため、外部CDNへの依存は排除。
