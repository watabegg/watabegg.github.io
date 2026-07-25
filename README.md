# watabe.gg

[watabe.gg](https://watabe.gg/) のソースコードです。Astroで構築した、ポートフォリオ兼技術ブログです。

[![Verify public site](https://github.com/watabegg/watabegg.github.io/actions/workflows/astro.yml/badge.svg)](https://github.com/watabegg/watabegg.github.io/actions/workflows/astro.yml)

## このリポジトリの構成

- `src/content/blog/`：技術記事
- `src/content/products/`：公開用の制作物記事
- `identity/`：プロフィール・経歴・採用文書のローカルSSoT（Git管理外）
- `src/documents/`：スキルシート、履歴書、職務経歴書
- `slide/`：Slidev製の自己紹介資料

公開用のProduct記事と採用文書用の職務経歴は、同じ制作物を扱う場合も別々に管理します。実際の個人情報・経歴を含むIdentityと生成PDFは、公開ビルドにもGitにも含めません。

## 技術スタック

Astro 6 / TypeScript / Tailwind CSS 4 / daisyUI / pnpm / Slidev

## セットアップ

```bash
pnpm install --frozen-lockfile
pnpm --dir slide install --frozen-lockfile
cp -R identity.example identity
pnpm dev
```

開発サーバーは通常 `http://localhost:4321` で起動します。`identity.example/` は架空データです。自身のデータへ置き換える場合は、Git管理外の `identity/` だけを編集します。

## よく使うコマンド

```bash
pnpm dev             # 公開サイトの開発サーバー
pnpm check           # 型・Astro・Biomeの検査
pnpm identity:check  # ローカルIdentityを含む検査
pnpm build:public    # 公開サイトをdist/へ生成
pnpm verify:public   # 公開成果物への非公開情報混入を検査
pnpm documents:dev   # ローカル文書プレビュー
pnpm documents:pdf   # 3種類のPDFを生成
```

文書プレビューは `http://127.0.0.1:4321/documents/`、PDFの出力先はGit管理外の `documents/output/` です。詳しいIdentity・文書運用は [docs/identity-and-documents.md](docs/identity-and-documents.md) を参照してください。

## デプロイ

GitHub Actionsは架空Identityを使った公開ビルドの検証だけを行います。本番公開はローカルで漏えい検査まで通し、成果物のスナップショットだけを `gh-pages` ブランチへ送ります。

```bash
pnpm deploy -- --dry-run
pnpm deploy
```

`pnpm deploy` は送信先リモートを検証し、`gh-pages` の更新にはforce-with-leaseを使用します。
