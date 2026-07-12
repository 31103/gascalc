# ガス使用量計算ツール

## 概要

このツールは、入力された日付時刻と流量から、日ごとの酸素および窒素の使用量を計算します。
Material Design 3 に準拠したモダンなUI/UXに刷新され、Svelte フレームワークを採用することで開発体験と保守性が向上しました。
ビルド成果物は単一のHTMLファイルとして提供され、ローカル環境でインターネット接続なしに動作します。

**デモ**: https://31103.github.io/gascalc/gascalc.html

## 使用方法

1. フッターの「日付時刻」欄に、日付と時刻を `DDHHMM` の形式で入力します。
   - 例：2日9時7分の場合、`20907` と入力します。
   - 日付を省略することも可能です。その場合、直近で指定した日付を引き継ぎます。**初回入力で日付を省略した場合は「1日」として扱われます。**
   - 入力は時系列順ではなく、順不同でも可能です。
2. 「流量 (L/min)」欄に、流量を `L/min` 単位で入力します。
   - 例：酸素 1.5L/min の場合、`1.5` と入力します。
   - 人工呼吸器の場合は、分時換気量を入力します。
3. FiO2モードが有効になっている場合は、「FiO2 (%)」欄に、酸素濃度をパーセントで入力します。
   - 21 以上 100 以下の整数を入力してください。
4. フッターの「<span class="material-symbols-outlined">add</span> (追加)」アイコンボタンをクリックします。
5. 入力した内容がリストに追加され、酸素および窒素の使用量が計算されます。リスト内の各項目には「<span class="material-symbols-outlined">edit</span> (修正)」「<span class="material-symbols-outlined">delete</span> (削除)」アイコンボタンが表示されます。
6. 計算結果の各項目には「<span class="material-symbols-outlined">content_copy</span> (コピー)」アイコンボタンが表示されます。
7. トップアプリバーの「クリア」ボタンをクリックすると、入力内容と計算結果がクリアされます。

## 設定

トップアプリバーの「<span class="material-symbols-outlined">settings</span> (設定)」アイコンをクリックすると、設定ダイアログを開くことができます。

### FiO2モード

- FiO2モードを有効にすると、FiO2 を指定してガスの使用量を計算できます。
- ハイフローセラピーや人工呼吸器の算定に利用できます。

### 室内気不使用

- FiO2モードが有効な場合にのみ使用できます。
- 室内気 (Room Air) を使用せず、配管からの合成空気を使用する場合に、この設定を有効にします。
- 一部の人工呼吸器で使用します。

## 使用例

### 例：酸素吸入

1. 2日の8時30分であれば、日付時刻：`20830`と入力する。
2. 酸素流量2L/minであれば、流量：`2`と入力する。
3. 「追加」ボタンをクリックする。
4. 続けて必要な分の日付時刻と流量のペアを入力する。
5. 計算結果が表示される。

## 技術スタック

- 言語: TypeScript
- フレームワーク: Svelte 4
- ビルドツール: Vite
- CSSフレームワーク: TailwindCSS v3
- アイコン: Material Symbols (ローカルホスティング)
- バンドラ: Vite (via Rollup)
- テスト: Vitest
- Lint / Format: Biome
- コミット検証: commitlint + husky
- CI/CD: GitHub Actions
- リリース管理: release-please

## ディレクトリ構造

```
gascalc/
├── dist/
│   └── gascalc.html       (ビルド成果物: 単一HTMLファイル)
├── src/
│   ├── assets/
│   │   └── fonts/         (Material Symbols フォントファイル)
│   ├── components/        (Svelte コンポーネント)
│   │   ├── EntryList.svelte
│   │   ├── SettingsDialog.svelte
│   │   └── UsageResult.svelte
│   ├── types/
│   │   └── entry.ts       (型定義)
│   ├── utils/
│   │   └── calculation.ts (計算ロジック)
│   ├── App.svelte         (メインコンポーネント: 状態管理)
│   ├── app.css            (Tailwindディレクティブを含むCSS)
│   ├── main.ts            (エントリポイント)
│   └── vite-env.d.ts      (Vite型定義)
├── index.html             (HTMLテンプレート)
├── tests/
│   └── calculation.test.ts (計算ロジックのテスト)
├── .gitignore
├── deno.jsonc             (Deno設定・タスクランナー)
├── package.json           (npm依存関係)
├── postcss.config.js      (PostCSS設定)
├── tailwind.config.js     (TailwindCSS設定)
├── tsconfig.json          (TypeScript設定)
├── vite.config.ts         (Vite設定)
└── README.md
```

## ビルド方法

npm コマンドツールを使用できます (Deno 環境でも `deno task` でラップされたコマンドを使用可能)。

- **セットアップ (依存関係のインストール):**
  ```bash
  npm install
  ```

- **開発サーバー起動:**
  ```bash
  npm run dev
  # または
  deno task dev
  ```
  `http://localhost:5173` で開発サーバーが起動します。

- **統合ビルド (単一HTML生成):**
  ```bash
  npm run build
  # または
  deno task build
  ```
  ビルド成果物は `dist/gascalc.html` という単一のHTMLファイルとして出力されます。
  このファイルには、CSS、JavaScript、アイコンフォントがすべてインラインで埋め込まれています。

## テスト・Lint

```bash
npm test
npm run lint
```

## CI/CD

GitHub Actions により、push / pull request 時の Lint・テスト・ビルド、
GitHub Pagesへのデプロイ、リリース成果物の作成を自動化しています。

## ライセンス

このプロジェクトはMITライセンスです。詳細については、`LICENSE` ファイルを参照してください。

また、このプロジェクトで使用しているアセットの一部（例: Material Symbols）は、Apache License 2.0 の下でライセンスされています。これらのアセットに関するライセンス情報は、該当アセットの配布元、およびビルドされたHTMLファイル内のコメントを参照してください。

## 注意点

- 計算結果はあくまでも目安であり、実際の使用量とは異なります。
- このツールを使用した結果生じた損害等について、作者は一切の責任を負いません。
