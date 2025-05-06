# GasCalc リファクタリング計画 (改訂版)

## 1. 目標

- **保守性の向上:** HTML, CSS, TypeScript
  を分離し、コードの見通しと再利用性を高める。
- **開発効率の向上:**
  TypeScriptによる型安全性、Denoのツールチェーン、TailwindCSSによる効率的なスタイリングを実現する。
- **モダン化:** 最新の技術スタックとディレクトリ構造を採用する。
- **UIのモダン化:**
  より洗練されたデザインとユーザー体験を提供する。レスポンシブデザインを改善する。
- **品質向上:** 単体テストを導入し、コードの信頼性を高める。
- **要件維持:**
  - 最終的な成果物は単一のHTMLファイルとする。
  - `file://` プロトコルで動作し、オフライン環境で使用可能とする。
  - 既存の機能（ガス計算ロジック、UI操作）を維持する。

## 2. 技術スタック

- **言語:** TypeScript
- **ランタイム/ツールチェーン:** Deno
- **CSSフレームワーク:** TailwindCSS
- **テスト:** Deno 標準テストランナー (`deno test`)

## 3. ディレクトリ構造案

```mermaid
graph TD
    A[gascalc/] --> B[src/];
    A --> C[dist/];
    A --> D[tests/];
    A --> E[memory-bank/];
    A --> F[docs/];
    A --> G[deno.jsonc];
    A --> H[tailwind.config.js];
    A --> I[postcss.config.js];
    A --> J[build.ts];
    A --> K[README.md];
    A --> L[.gitignore];

    B --> B1[index.html];
    B --> B2[main.ts];
    B --> B3[styles/];
    B3 --> B3a[input.css];
    B --> B4[utils/];
    B4 --> B4a[calculation.ts];
    B4 --> B4b[dom.ts];
    B --> B5[types/];
    B5 --> B5a[entry.ts];

    C --> C1[gascalc.html];
    C --> C2[.temp/]; # ビルド時の一時ファイル用

    D --> D1[calculation.test.ts];

    F --> F1[refactoring-plan.md];
```

- **`src/`**: ソースコードディレクトリ
  - `index.html`:
    アプリケーションの基本的なHTML構造。ビルド時にCSSとJSが埋め込まれるテンプレート。
  - `main.ts`:
    アプリケーションのエントリーポイント。イベントリスナーの設定、UIの初期化など。
  - `styles/input.css`: TailwindCSSのディレクティブ (`@tailwind base;` など)
    やカスタムCSSを記述するファイル。
  - `utils/`: ユーティリティ関数を格納するディレクトリ (例: `calculation.ts`
    に計算ロジック、`dom.ts` にDOM操作関連)。
  - `types/`: 型定義ファイルを格納するディレクトリ (例: `entry.ts`
    に入力データの型定義)。
- **`dist/`**: ビルド成果物を格納するディレクトリ。
  - `gascalc.html`:
    最終的に生成される単一のHTMLファイル。CSSとJavaScriptがインライン展開される。
  - `.temp/`: ビルドプロセス中の一時ファイル（CSS,
    JSバンドル）を格納するディレクトリ。ビルド完了後に削除される。
- **`tests/`**: テストコードを格納するディレクトリ。
  - `calculation.test.ts`: 計算ロジックのユニットテストなど。
- **`memory-bank/`**: 既存のMemory Bankディレクトリ。
- **`docs/`**: ドキュメント用ディレクトリ。
  - `refactoring-plan.md`: この計画ファイル。
- **`deno.jsonc`**:
  Denoの設定ファイル。タスクランナー、リンター、フォーマッター、インポートマップなどを定義。
- **`tailwind.config.js`**: TailwindCSSの設定ファイル。
- **`postcss.config.js`**: PostCSSの設定ファイル (TailwindCSSのビルドに必要)。
- **`build.ts`**: CSSとJSをHTMLにインライン展開するためのDenoスクリプト。
- **`README.md`**: プロジェクトの説明ファイル (更新が必要)。
- **`.gitignore`**: Gitの管理対象外ファイルを指定 (`dist/`, `node_modules/`,
  `dist/.temp/` など)。

## 4. ビルドプロセス案

```mermaid
graph LR
    subgraph "ソースファイル"
        A[src/index.html]
        B[src/main.ts]
        C[src/styles/input.css]
    end

    subgraph "ビルドタスク (deno task build)"
        direction LR
        T1[1. build:css<br>(tailwindcss)] --> T2[2. build:js<br>(deno bundle)] --> T3[3. build:html<br>(deno run build.ts)] --> T4[4. クリーンアップ<br>(rm -rf dist/.temp)]
    end

    subgraph "一時ファイル (dist/.temp/)"
        CSS[styles.css]
        JS[bundle.js]
    end

    subgraph "成果物 (dist/)"
        HTML[gascalc.html]
    end

    C --> T1 --> CSS;
    B --> T2 --> JS;
    A --> T3;
    CSS --> T3;
    JS --> T3;
    T3 --> HTML;
    HTML --> T4;


    style HTML fill:#f9f,stroke:#333,stroke-width:2px
```

1. **CSSビルド (`deno task build:css`):**
   - コマンド例:
     `deno run -A npm:tailwindcss -i ./src/styles/input.css -o ./dist/.temp/styles.css --minify`
   - `src/styles/input.css` をTailwindCSSで処理し、minifyされたCSSを
     `dist/.temp/styles.css` に出力。
2. **TypeScriptバンドル (`deno task build:js`):**
   - コマンド例: `deno bundle src/main.ts dist/.temp/bundle.js`
   - `src/main.ts`
     をエントリーポイントとして依存関係を解決し、単一のJavaScriptファイル
     `dist/.temp/bundle.js` を生成。
3. **HTML生成 (`deno task build:html`):**
   - コマンド例: `deno run -A ./build.ts`
   - `build.ts` スクリプトが実行される。
   - `src/index.html` をテンプレートとして読み込む。
   - `dist/.temp/styles.css` の内容を `<style>` タグ内にインライン展開。
   - `dist/.temp/bundle.js` の内容を `<script type="module">`
     タグ内にインライン展開。
   - 最終的なHTMLを `dist/gascalc.html` として出力。
4. **クリーンアップ:**
   - 一時ディレクトリ `dist/.temp` を削除。

- **統合ビルドコマンド (`deno task build`):** 上記 1-4 を順に実行する。
- **開発用コマンド (`deno task dev`):** `tailwindcss --watch`
  を実行し、CSSの変更をリアルタイムに反映させる（JS/HTMLの変更は別途リロードが必要）。

## 5. リファクタリング手順案

1. **準備:**
   - `git checkout -b feature/refactor-gascalc` でフィーチャーブランチを作成。
   - `memory-bank/activeContext.md`
     を更新し、リファクタリングタスクを開始することを記録。
   - Deno と TailwindCSS の初期設定 (`deno.jsonc`, `tailwind.config.js`,
     `postcss.config.js`, `build.ts`
     の雛形作成、`npm:tailwindcss postcss autoprefixer` の依存関係追加検討)。
   - `.gitignore` に `dist/`, `node_modules/`, `dist/.temp/` などを追加。
   - 最初のコミット (`chore: 初期セットアップ`)。
2. **ディレクトリ構造作成:**
   - 提案されたディレクトリ構造を作成。
   - コミット (`chore: ディレクトリ構造作成`)。
3. **HTML/CSS分割とTailwindCSS適用 & UIモダン化:**
   - `gascalc.html` のHTML構造部分を `src/index.html` に移動。
   - 既存のスタイルを参考にしつつ、TailwindCSSのユーティリティクラスを適用し、**UIデザインの見直しと改善**を行う。基本的なスタイルは
     `src/styles/input.css` で `@tailwind` ディレクティブを使って読み込む。
   - `deno task dev` を実行しながら、スタイルの適用と表示を確認。
   - コミット (`refactor: HTML構造分離、TailwindCSS適用、UI改善`)。
4. **TypeScript分割と移行:**
   - `gascalc.html` の `<script>` 部分のJavaScriptコードを `src/main.ts`
     に移動。
   - ロジックを `src/utils/calculation.ts`, `src/utils/dom.ts`
     などに適切に分割。
   - 型定義を `src/types/` に作成し、コードに型アノテーションを追加。
   - グローバル変数による状態管理を見直し、モジュールスコープやクラスなどを用いて構造化。
   - コミット (`refactor: JavaScriptをTypeScriptに移行し分割`)。
5. **ビルドプロセス構築:**
   - `deno.jsonc` に `build:css`, `build:js`, `build:html`, `build`
     タスクを定義。
   - `build.ts` スクリプトを実装。
   - `deno task build` を実行し、`dist/gascalc.html`
     が正しく生成されることを確認。
   - コミット (`feat: ビルドプロセスを構築`)。
6. **テスト実装:**
   - `src/utils/calculation.ts` の計算ロジックに対するユニットテストを
     `tests/calculation.test.ts` に記述。
   - `deno test` を実行し、テストがパスすることを確認。
   - コミット (`test: 計算ロジックのユニットテストを追加`)。
7. **動作確認と調整:**
   - 生成された `dist/gascalc.html` をブラウザで `file://`
     プロトコルで開き、すべての機能がリファクタリング前と同様に動作することを確認。
   - **UI/UXの観点** (デザイン、レスポンシブ、インタラクション)
     からも確認し、必要に応じてコードやスタイルを修正。
   - コミット (`fix: 動作確認とUI/UX調整`)。

### フェーズ7における問題点と修正計画 (2025/05/06)

フェーズ7の動作確認中に以下の問題が確認されました。

- **デザイン崩れ:** TailwindCSSのスタイルが適用されていない。
- **HHMM入力不可:** 日付時刻フィールドでHHMM形式の入力が正しく処理されない。
- **クリアボタン無効:** クリアボタンをクリックしても動作しない。
- **設定ボタン無効:** 設定ボタンをクリックしても設定モーダルが表示されない。
- **コンソールエラー:**
  `Uncaught TypeError: Cannot set properties of null (setting 'onclick')`
  が発生。

これらの問題を解決するため、以下の優先順位で修正を行います。

```mermaid
graph TD
   subgraph 修正優先度 (改訂版)
       P1[1. ボタン修正 (クリア/設定)] --> P2[2. CSS読み込み/適用問題調査] --> P3[3. 日付時刻修正 (HHMM)] --> P4[4. その他デザイン調整]
   end

   subgraph 修正内容
       P1 --> FixButtons[main.ts: セレクタ修正<br>index.html: ID追加]
       P2 --> InvestigateCSS[dist/gascalc.html確認<br>ブラウザ開発ツール調査<br>build.ts/build:css再確認]
       P3 --> FixDateTime[main.ts: parseDateTime/lastDate修正]
       P4 --> FixMinorDesign[dom.ts: updateUIクラス確認など]
   end

   FixButtons & InvestigateCSS & FixDateTime & FixMinorDesign --> SwitchToCode[Codeモードで実装]
```

**具体的な修正ステップ:**

1. **ボタンイベントリスナー修正:**

- `src/index.html`
  のクリアボタン、設定ボタン、設定モーダル閉じるボタンにIDを付与。
- `src/main.ts` の `initialize` 関数内で、IDセレクタ (`getElementById`)
  を使用してボタン要素を取得するように修正。
- HTML側の `onclick` 属性を削除。

2. **CSS読み込み/適用問題調査:**

- `dist/gascalc.html` を確認し、CSSがインライン展開されているか確認。
- 展開されていない場合はビルドプロセス (`build.ts`, `deno task build:css`)
  を再調査。
- 展開されている場合はブラウザ開発者ツールで原因を特定。

3. **日付時刻処理修正:**

- `src/main.ts` の `parseDateTime` 関数と `lastDate` 更新ロジックを修正。

4. **その他デザイン調整:**

- 必要に応じて `src/utils/dom.ts` の `updateUI` 内のクラス指定などを調整。

**修正状況 (2025/05/06):**

- ボタンイベントリスナーの問題 (TypeError) は修正済み。
- 日付時刻処理 (HHMM形式入力) の問題は修正済み。
- **未解決:**
  TailwindCSSのビルドプロセスがソースコード内のクラスを正しく検知できず、必要なCSSルールが生成されないため、デザインが適用されない。この問題は詳細な調査が必要なため、別タスクとして切り出す。

8. **ドキュメント更新:**
   - `README.md`
     に新しい技術スタック、ディレクトリ構造、ビルド方法、実行方法などを記載。
   - `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`,
     `memory-bank/progress.md` をリファクタリング内容に合わせて更新。
   - コミット (`docs: READMEとMemory Bankを更新`)。
9. **完了:**
   - `memory-bank/activeContext.md`
     を更新し、リファクタリングタスクが完了したことを記録。
   - (必要であれば) Pull Request を作成し、レビュー後にマージ。

## 6. 注意点

- **Conventional Commits:** コミットメッセージは規約に従い、日本語で記述する
  (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` など)。
- **コミット粒度:** 各ステップが完了するごとに、意味のある単位でコミットを行う。
- **Memory Bank 更新:** 各主要ステップの後など、適切なタイミングで Memory Bank
  の関連ファイルを更新する。特に `activeContext.md` は作業の区切りで更新する。
