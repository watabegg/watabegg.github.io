---
title: "個人的禁煙用アプリ"
publishDate: 2025-03-02
description: "自分が禁煙するために作った喫煙記録アプリ"
tags: ["Web開発", "Next.js", "TypeScript", "PostgreSQL", "Vercel", "Cline"]
imageUrl: "/images/product/no-smoking.png"
---

## 概要

このアプリは、禁煙を目指す自分のために作った喫煙記録アプリです。人に監視された状態でタバコの本数を減らせるよう、自分専用のツールを作りました。

## 使用技術

* **[Next.js](https://nextjs.org/)**: フロントエンドとバックエンドを一体化して開発できるフレームワーク。
* **TypeScript**: 型安全なコードで開発効率をアップ。
* **[PostgreSQL](https://www.postgresql.org/)**: 喫煙データをしっかり保存するためのデータベース。
* **[Vercel](https://vercel.com/)**: デプロイが超簡単で、サーバーレスな環境を提供。
* **Chart.js**: グラフ用に用いました。

## 工夫した点

1. **シンプルなUI**
   - 禁煙を続けるために、使いやすさを最優先にデザイン。
   - 必要最低限の機能だけを実装して、迷わず使えるようにしました。

2. **データの可視化**
   - 喫煙回数や禁煙日数をグラフで表示して、モチベーションを維持。

3. **Cline(Claude)の力を借りた開発**
   - Cline(Claude 3.7 Sonnet)に要件を伝えながら開発しました。初めてClineを使いながらの開発だったので新体験で面白かったです。
   - Chart.jsとかほぼClineの手柄でヤバい

## 参考リンク

* [アプリ](https://no-smoke-nine.vercel.app/)
* [GitHubリポジトリ](https://github.com/watabegg/no-smoke)
