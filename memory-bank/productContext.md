# プロダクトコンテキスト (Product Context)

## プロジェクトの目的 (Why this project exists)

この「ガス使用量計算ツール」は、医療現場（特に麻酔科や集中治療室など）で、患者さんが使用した医療ガス（主に酸素や窒素）の総量を、特定の期間や日付ごとに簡単に計算するために存在します。
医療ガスの使用量は、コスト管理や在庫管理、場合によっては診療報酬請求の観点からも重要ですが、手計算や複雑なスプレッドシートでの管理は手間がかかり、ミスも発生しやすいという課題がありました。
このツールは、その計算プロセスを自動化し、迅速かつ正確な使用量把握を支援することを目的としています。

## 解決する問題 (What problems it solves)

- **手計算の煩雑さと時間消費**:
  流量や使用時間が変動する場合、日ごとや期間ごとの総使用量を手計算するのは非常に時間がかかり、面倒です。
- **計算ミスのリスク**:
  手計算や複雑なスプレッドシートでは、計算ミスや入力ミスが発生しやすく、誤った使用量を出してしまう可能性があります。
- **迅速な使用量把握の困難さ**:
  緊急時や多忙な業務の中で、迅速に使用量を確認したい場合に、手計算では対応が遅れることがあります。
- **FiO2や特殊なガス混合の計算**:
  ハイフローセラピーや人工呼吸器など、FiO2（吸入酸素濃度）を指定したり、室内気を使用しない特殊なガス混合（例：医療用空気と酸素の混合）の場合の計算はより複雑になりますが、このツールはそれらにも対応します。
- **記録と共有の非効率**:
  計算結果の記録や他者との共有が、紙ベースや統一されていないフォーマットで行われると非効率です。このツールは計算結果を簡単にコピーできる機能を提供します。

## 理想的な動作 (How it should work)

1. **簡単な入力**:
   ユーザーは、日付時刻、流量、そして必要に応じてFiO2を直感的に入力できる。
   - 入力形式はシンプルで覚えやすく、多少の入力揺れ（例：日付の先行ゼロなし）にも対応できると望ましい。
   - 入力は時系列順でなくても、ツール側で自動的にソートして計算する。
2. **リアルタイム計算と表示**:
   新しいデータが入力されるたびに、日ごとのガス使用量（酸素、およびFiO2モードかつ室内気不使用モードの場合は窒素も）が自動的に計算され、リスト形式で分かりやすく表示される。
3. **柔軟なモード設定**:
   - 通常の酸素投与と、FiO2を指定するハイフロー/人工呼吸器モードを簡単に切り替えられる。
   - 室内気を使用しない特殊なケースにも対応できる。
4. **入力データの管理**:
   - 入力したデータはリストで確認でき、間違えた場合は簡単に修正・削除できる。
   - すべての入力データを一括でクリアできる。
5. **結果の活用**:
   計算された使用量を簡単にコピーして、他の記録システム（電子カルテ、報告書など）にペーストできる。
6. **モダンで直感的なUI/UX**:
   - Material Design 3
     に準拠し、視覚的に分かりやすく、操作しやすいインターフェースを提供する。
   - 主要な操作はアイコンボタンで直感的に行える。
   - レスポンシブデザインにより、様々な画面サイズで快適に利用できる。
7. **オフライン動作と配布の容易性**:
   - ビルドされた成果物は単一のHTMLファイルであり、インターネット接続なしでローカル環境で完全に動作する。
   - ファイルの配布や共有が容易である。
8. **明確なドキュメンテーション**: 使用方法、設定、技術的な詳細などが
   `README.md` に記載されている。

このツールは、医療事務従事者や臨床スタッフが、日々の業務の中で迅速かつ正確にガス使用量を把握し、記録・報告作業の効率化に貢献することを目指しています。
