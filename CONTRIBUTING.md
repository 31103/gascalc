# Contributing to gascalc

このプロジェクトへの貢献方法を説明します。

## コミットメッセージの形式

このプロジェクトでは [Conventional Commits](https://www.conventionalcommits.org/) を採用しています。コミットメッセージは以下の形式に従ってください。

```
<type>(<scope>): <subject>
```

### type（必須）

| type       | 説明                          |
|------------|-------------------------------|
| `feat`     | 新機能                        |
| `fix`      | バグ修正                      |
| `docs`     | ドキュメントのみの変更        |
| `style`    | コードの動作に影響しない変更  |
| `refactor` | リファクタリング              |
| `test`     | テストの追加・修正            |
| `chore`    | ビルド・ツール・設定の変更    |
| `ci`       | CI/CD の変更                  |

### scope（任意）

変更箇所を指定します。例：`feat(ui):`, `fix(calc):`

### breaking changes

破壊的変更を含む場合は、type の後に `!` を付けます。例：`feat!: 破壊的変更`

### 例

```
feat: FiO2 モードに補助酸素計算を追加
fix(calc): 日跨ぎ計算の精度を改善
docs: README.md を更新
style: インデントを修正
refactor: 計算ロジックを関数化
test: エッジケースのテストを追加
chore: Biome を導入
ci: GitHub Actions ワークフローを追加
```

## 開発フロー

1. リポジトリをフォーク
2. 機能ブランチを作成（例：`feature/add-fio2-calc`）
3. 変更をコミット（Conventional Commits に従う）
4. プルリクエストを作成

## ビルド方法

```bash
npm install
npm run build
```

## テスト

```bash
npm test
```

## Lint / Format

```bash
npm run lint      # Lint チェック
npm run lint:fix  # Lint 自動修正
npm run format    # Format
```

## リリース

リリースは自動で行われます。Conventional Commits に従ってコミットすると、[release-please](https://github.com/googleapis/release-please) が自動的にリリース PR を作成します。

- `feat:` → minor バージョンアップ
- `fix:` → patch バージョンアップ
- `feat!: ` → major バージョンアップ

マージされると GitHub Release が作成され、ビルド成果物がデプロイされます。
