# ガス使用量計算ツール

## 概要

このツールは、入力された日付時刻と流量から、日ごとの酸素および窒素の使用量を計算します。
Material Design 3 に準拠したモダンな UI/UX と、ダークモードに対応しています。
主要な操作はアイコンボタンで行え、入力項目の in-place 編集（その場編集）にも対応しています。
ビルド成果物は単一の HTML ファイルとして提供され、ローカル環境でインターネット接続なしに動作します。

**デモ**: https://31103.github.io/gascalc/gascalc.html

## 使用方法

1. フッターの「日付時刻」欄に、日付と時刻を `DDHHMM` の形式で入力します。
   - 例：2 日 9 時 7 分の場合、`20907` と入力します。
   - 日付を省略することも可能です。その場合、直近で指定した日付を引き継ぎます。**初回入力で日付を省略した場合は「1 日」として扱われます。**
   - 入力は時系列順ではなく、順不同でも可能です。
2. 「流量 (L/min)」欄に、流量を `L/min` 単位で入力します。
   - 例：酸素 1.5L/min の場合、`1.5` と入力します。
   - 人工呼吸器の場合は、分時換気量を入力します。
3. FiO2 モードが有効になっている場合は、「FiO2 (%)」欄に、酸素濃度をパーセントで入力します。
   - 21 以上 100 以下の整数を入力してください。
4. フッターの「<span class="material-symbols-outlined">add</span> (追加)」アイコンボタンをクリックします。
5. 入力した内容がリストに追加され、酸素および窒素の使用量が計算されます。
6. リスト内の各項目には「<span class="material-symbols-outlined">edit</span> (修正)」と「<span class="material-symbols-outlined">delete</span> (削除)」アイコンボタンが表示されます。
   - **修正**: クリックするとその場で入力フォームに切り替わり、直接編集できます（in-place 編集）。
   - **削除**: クリックすると項目を削除できます。
7. 計算結果の各項目には「<span class="material-symbols-outlined">content_copy</span> (コピー)」アイコンボタンが表示されます。
   - クリックすると、診療報酬請求用のフォーマット `402400+552010/<酸素量>*1` がクリップボードにコピーされます。
8. トップアプリバーの「クリア」ボタンをクリックすると、入力内容と計算結果がクリアされます。

## 設定

トップアプリバーの「<span class="material-symbols-outlined">settings</span> (設定)」アイコンをクリックすると、設定ダイアログを開くことができます。

### ダークモード

- ダークモードを有効にすると、目に優しいダークテーマに切り替わります。
- 設定はブラウザに保存され、次回起動時も維持されます。

### FiO2 モード

- FiO2 モードを有効にすると、FiO2 を指定してガスの使用量を計算できます。
- ハイフローセラピーや人工呼吸器の算定に利用できます。

### 室内気不使用

- FiO2 モードが有効な場合にのみ使用できます。
- 室内気 (Room Air) を使用せず、配管からの合成空気を使用する場合に、この設定を有効にします。
- 一部の人工呼吸器で使用します。

## 使用例

### 例：酸素吸入

1. 2 日の 8 時 30 分であれば、日付時刻：`20830` と入力する。
2. 酸素流量 2L/min であれば、流量：`2` と入力する。
3. 「追加」ボタンをクリックする。
4. 続けて必要な分の日付時刻と流量のペアを入力する。
5. 計算結果が表示される。
6. 必要に応じて、リスト内の項目をその場で編集できる。

## 技術スタック

- 言語：TypeScript
- ランタイム：Node.js 24（LTS）
- CSS フレームワーク：TailwindCSS v4
- アイコン：Material Symbols (ローカルホスティング)
- バンドラ：esbuild
- テスト：Vitest
- Lint / Format: Biome
- コミット検証：commitlint + husky
- CI/CD: GitHub Actions
- リリース管理：release-please

## ディレクトリ構造

```
gascalc/
├── .github/
│   └── workflows/
│       ├── ci.yml             (テスト・ビルド検証)
│       ├── deploy.yml         (GitHub Pages デプロイ)
│       ├── release.yml        (Release への HTML 添付)
│       └── release-please.yml (自動バージョン管理)
├── .husky/
│   └── commit-msg             (コミットメッセージ検証フック)
├── dist/
│   └── gascalc.html  (ビルド成果物)
├── scripts/
│   └── clean-temp.mjs (一時ファイル削除用スクリプト)
├── src/
│   ├── assets/
│   │   └── fonts/
│   │       ├── material-symbols.css       (Material Symbols 用 CSS)
│   │       └── MaterialSymbolsOutlined.ttf (Material Symbols フォントファイル)
│   ├── index.html         (HTML テンプレート)
│   ├── main.ts            (アプリケーションエントリーポイント)
│   ├── styles/
│   │   └── input.css      (TailwindCSS 入力ファイル)
│   ├── types/
│   │   └── entry.ts       (型定義)
│   └── utils/
│       ├── calculation.ts (計算ロジック)
│       └── dom.ts         (DOM 操作)
├── tests/
│   └── calculation.test.ts (計算ロジックのテスト)
├── .gitignore
├── biome.json             (Biome 設定)
├── build.mjs              (ビルドスクリプト)
├── commitlint.config.js   (commitlint 設定)
├── CONTRIBUTING.md        (開発ガイドライン)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## セットアップ

```bash
npm install
```

## ビルド方法

- **統合ビルド (CSS ビルド、JS バンドル、アセットインライン化、単一 HTML 生成):**
  ```bash
  npm run build
  ```
  ビルド成果物は `dist/gascalc.html` という単一の HTML ファイルとして出力されます。
  このファイルには、CSS、JavaScript、アイコンフォントがすべてインラインで埋め込まれています。

- **開発モード (TailwindCSS の watch):**
  ```bash
  npm run dev
  ```
  開発中は `src/index.html` を直接ブラウザで開いて確認します（この場合、TailwindCSS の変更は `src/styles/output.css` に反映されます）。

## テスト

```bash
npm test          # テスト実行
npm run test:watch # ウォッチモード
```

## Lint / Format

```bash
npm run lint      # Lint チェック
npm run lint:fix  # Lint 自動修正
npm run format    # Format
```

## 実行方法

1. プロジェクトをビルドします：`npm run build`
2. 生成された単一ファイル `dist/gascalc.html` をブラウザで開きます。

## CI/CD

GitHub Actions による自動化：

- **CI**: push / PR 時に lint → test → build を実行
- **Deploy**: main への push 時に GitHub Pages へ自動デプロイ
- **Release**: Release 作成時に HTML を Release Assets に添付
- **release-please**: Conventional Commits ベースの自動バージョン管理

## コントリビュート

詳しくは [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ライセンス

このプロジェクトは MIT ライセンスです。詳細については、`LICENSE` ファイルを参照してください。

また、このプロジェクトで使用しているアセットの一部（例：Material Symbols）は、Apache License 2.0 の下でライセンスされています。これらのアセットに関するライセンス情報は、該当アセットの配布元、およびビルドされた HTML ファイル内のコメントを参照してください。

## 注意点

- 計算結果はあくまでも目安であり、実際の使用量とは異なります。
- このツールを使用した結果生じた損害等について、作者は一切の責任を負いません。
