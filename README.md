# ガス使用量計算ツール

## 概要

このツールは、入力された日付時刻と流量から、日ごとの酸素および窒素の使用量を計算します。

[ガス使用量計算ツール（デモ）](https://31103.github.io/ijitools/gascalc/gascalc.html)
(注意: デモはリファクタリング前のバージョンの可能性があります)

## 使用方法

1. 「日付時刻」欄に、日付と時刻を `DDHHMM` の形式で入力します。
   - 例：2日9時7分の場合、`20907` と入力します。
   - 日付を省略することも可能です。その場合、直近で指定した日付を引き継ぎます。**初回入力で日付を省略した場合は「1日」として扱われます。**
   - 入力は時系列順ではなく、順不同でも可能です。
2. 「流量 (L/min)」欄に、流量を `L/min` 単位で入力します。
   - 例：酸素 1.5L/min の場合、`1.5` と入力します。
   - 人工呼吸器の場合は、分時換気量を入力します。
3. FiO2モードが有効になっている場合は、「FiO2
   (%)」欄に、酸素濃度をパーセントで入力します。
   - 21 以上 100 以下の整数を入力してください。
4. 「追加」ボタンをクリックします。
5. 入力した内容がリストに追加され、酸素および窒素の使用量が計算されます。
6. 「クリア」ボタンをクリックすると、入力内容と計算結果がクリアされます。

## 設定

ツールバーの歯車アイコンをクリックすると、設定画面を開くことができます。

### FiO2モード

- FiO2モードを有効にすると、FiO2 を指定してガスの使用量を計算できます。
- ハイフローセラピーや人工呼吸器の算定に利用できます。

### 室内気不使用

- FiO2モードが有効な場合にのみ使用できます。
- 室内気 (Room Air)
  を使用せず、配管からの合成空気を使用する場合に、この設定を有効にします。
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
- ランタイム/ツールチェーン: Deno
- CSSフレームワーク: TailwindCSS
- バンドラ: esbuild (Deno経由)

## ディレクトリ構造

```
gascalc/
├── dist/
│   └── gascalc.html  (ビルド成果物)
├── docs/
│   └── refactoring-plan.md
├── memory-bank/
│   ├── activeContext.md
│   ├── productContext.md
│   ├── progress.md
│   ├── projectbrief.md
│   ├── systemPatterns.md
│   └── techContext.md
├── scripts/
│   └── clean_temp.ts (一時ファイル削除用スクリプト)
├── src/
│   ├── index.html         (HTMLテンプレート)
│   ├── main.ts            (アプリケーションエントリーポイント)
│   ├── styles/
│   │   └── input.css      (TailwindCSS入力ファイル)
│   ├── types/
│   │   └── entry.ts       (型定義)
│   └── utils/
│       ├── calculation.ts (計算ロジック)
│       └── dom.ts         (DOM操作)
├── tests/
│   └── calculation.test.ts (計算ロジックのテスト)
├── .gitignore
├── build.ts               (ビルドスクリプト)
├── deno.jsonc             (Deno設定ファイル)
├── README.md
└── tailwind.config.js     (TailwindCSS設定ファイル)
```

## ビルド方法

以下の Deno タスクを使用します (`deno.jsonc` で定義)。

- **CSSのビルド:**
  ```bash
  deno task build:css
  ```
- **HTMLの生成 (JavaScriptのバンドルとインライン展開を含む):**
  ```bash
  deno task build:html
  ```
- **一時ファイルのクリーンアップ:**
  ```bash
  deno task clean:temp
  ```
- **統合ビルド (上記をすべて実行):**
  ```bash
  deno task build
  ```
- **開発モード (TailwindCSSのwatch):**
  ```bash
  deno task dev
  ```

## 実行方法

1. プロジェクトをビルドします: `deno task build`
2. 生成された `dist/gascalc.html` をブラウザで開きます。

## 注意点

- 計算結果はあくまでも目安であり、実際の使用量とは異なります。
- このツールを使用した結果生じた損害等について、作者は一切の責任を負いません。
