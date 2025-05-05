# watabegg 個人サイト

[![Deploy to GitHub Pages](https://github.com/watabegg/watabegg.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/watabegg/watabegg.github.io/actions/workflows/deploy.yml)

[watabegg.github.io](https://watabegg.github.io/) のソースコードリポジトリです。Astro を使用して構築された、ポートフォリオ兼技術ブログサイトです。

## ✨ 特徴

*   **高速パフォーマンス**: Astro による静的サイト生成と最適化。
*   **モダンな技術スタック**: Astro, Tailwind CSS, daisyUI, TypeScript を活用。
*   **コンテンツ駆動**: Markdown (`src/content/`) でブログ記事や製品紹介を管理。
*   **スムーズなページ遷移**: View Transitions API を利用 (Astro 経由)。
*   **SEO対策**: OGP, Twitter Card, サイトマップ, 構造化データ (JSON-LD) を実装。
*   **GitHub Pages への自動デプロイ**: GitHub Actions による CI/CD。

## 🛠️ 使用技術

*   **フレームワーク**: [Astro](https://astro.build/)
*   **スタイリング**: [Tailwind CSS](https://tailwindcss.com/), [daisyUI](https://daisyui.com/), [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)
*   **言語**: TypeScript
*   **パッケージマネージャー**: npm
*   **デプロイ**: GitHub Pages via GitHub Actions

## 🚀 セットアップとローカル開発

1.  **リポジトリをクローン**:
    ```bash
    git clone https://github.com/watabegg/watabegg.github.io.git
    cd watabegg.github.io
    ```

2.  **依存関係をインストール**:
    ```bash
    npm install
    ```

3.  **開発サーバーを起動**:
    ```bash
    npm run dev
    ```
    開発サーバーが起動し、`http://localhost:4321` (または利用可能なポート) でサイトにアクセスできます。

## 📝 コンテンツの追加・編集

ブログ記事や製品紹介は `src/content/` ディレクトリ内の Markdown ファイルで管理されています。

*   **ブログ記事**: `src/content/blog/`
*   **製品紹介**: `src/content/products/`

新しいコンテンツを追加するには、対応するディレクトリに新しい `.md` ファイルを作成し、Frontmatter (タイトル、公開日、タグなど) と本文を記述してください。スキーマは `src/content/config.ts` で定義されています。

## ⚙️ ビルド

静的なサイトファイルを生成するには:

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 🌐 デプロイ

このリポジトリは、`main` ブランチへのプッシュ時に GitHub Actions を使用して GitHub Pages (`https://watabegg.github.io/`) に自動的にデプロイされるように設定されています。

ワークフローの設定は `.github/workflows/deploy.yml` を参照してください。

## 🙏 謝辞

*   [Astro Documentation](https://docs.astro.build/)
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
*   [daisyUI Documentation](https://daisyui.com/)

---

*この README は AI (gemini - 2.5) によって生成されました。*
