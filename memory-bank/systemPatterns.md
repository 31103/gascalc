# システムパターン (System Patterns)

## アーキテクチャ

- **フロントエンドのみ**:
  静的なHTML、CSS、JavaScriptで構成されるクライアントサイドアプリケーション。
- **単一HTMLファイル**:
  ビルド成果物は、すべてのCSS、JavaScript、アセット（アイコンフォントなど）をインライン化した単一のHTMLファイル
  (`dist/gascalc.html`)。これにより、オフラインでの利用と配布の容易性を実現。
- **イベント駆動**: ユーザーインタラクションはDOMイベントを通じて処理される。
- **状態管理**:
  アプリケーションの状態（入力エントリ、モード設定など）は、`src/main.ts`
  内の変数として管理される。状態変更時にはUIを再描画。

## UI/UX

- **Material Design 3準拠**: GoogleのMaterial Design
  3ガイドラインに基づいたデザインシステムを採用。
  - カラーシステム、タイポグラフィ、コンポーネントスタイル、エレベーション、形状、モーションなど。
- **アイコン**: Material Symbolsを使用。フォントファイル (`.ttf`)
  と関連CSSをローカルにホスティングし、ビルド時にHTMLへインライン化。
- **レスポンシブデザイン**:
  TailwindCSSのユーティリティクラスを活用し、様々な画面サイズに対応。
- **コンポーネントベースのUI構成**:
  - トップアプリバー: タイトル、クリアボタン、設定ボタン。
  - カード: 入力内容リスト、計算結果リストの表示。
  - 入力フィールド: フローティングラベル付きのテキスト入力。
  - ボタン: アイコンボタン、テキストボタン。
  - ダイアログ: 設定画面のモーダル表示。
  - スイッチ: 設定項目（FiO2モード、室内気不使用モード）のトグル。
  - スナックバー: エラーメッセージや通知の表示。
  - ツールチップ: アイコンや入力フィールドの補助説明。

## ビルドプロセス (`build.ts`)

1. **ディレクトリ準備**: `dist` および `dist/.temp` ディレクトリを作成。
2. **TailwindCSSビルド**: `deno task build:css` を実行し、`src/styles/input.css`
   から `dist/.temp/styles.css` を生成（minify含む）。
3. **JavaScriptバンドル**: `esbuild` を使用し、`src/main.ts`
   をエントリーポイントとしてJavaScriptをバンドル・minifyし、メモリ上に出力。
4. **アセット読み込みと加工**:
   - `src/index.html` (HTMLテンプレート) を読み込み。
   - `dist/.temp/styles.css` (Tailwind CSS) を読み込み。
   - `src/assets/fonts/material-symbols.css` (アイコンフォント用CSS)
     を読み込み。
   - `src/assets/fonts/MaterialSymbolsOutlined.ttf` (アイコンフォントファイル)
     を読み込み、Base64エンコード。
   - アイコンフォント用CSS内のフォントファイル参照を、Base64エンコードされたデータURIに置換。
5. **HTMLへのインジェクション**:
   - HTMLテンプレート内のプレースホルダコメントを、Tailwind
     CSS、加工済みアイコンフォントCSS、バンドル済みJavaScriptでそれぞれ置換し、インライン化。
   - 開発用のCSS/JSリンクコメントを削除。
   - ライセンス情報（Material Symbols）をHTMLコメントとして `</body>`
     直前に挿入。
6. **最終HTML出力**: 加工済みのHTMLを `dist/gascalc.html` として書き出し。
7. **一時ファイルクリーンアップ**: `deno task clean:temp` を実行し、`dist/.temp`
   ディレクトリを削除 (これは `deno.jsonc` の `build`
   タスクの一部として実行される)。

## 状態管理のパターン

- `src/main.ts` がアプリケーションの主要な状態（`entries`, `fio2Mode`,
  `noRoomAirMode` など）を保持。
- DOMイベント（クリック、変更など）が発生すると、対応するハンドラ関数が状態を更新。
- 状態更新後、`updateUI` 関数（`src/utils/dom.ts`
  内）が呼び出され、現在の状態に基づいてDOMを再構築・更新。
- `localStorage` などによる状態の永続化は行っていない。

## CSS設計

- **TailwindCSS**: ユーティリティファーストのアプローチ。
- **カスタムCSS**: `src/styles/input.css` にて、Material Design
  3のデザイントークン（CSS変数として定義）やカスタムコンポーネントスタイル（例:
  `.btn`, `.input-field`, `.md-card` など）を `@layer components` で定義。
- アイコンフォント用のCSSもインライン化される。
