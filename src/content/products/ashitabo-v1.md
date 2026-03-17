---
title: "所属軽音サークルあしたぼHP & Webアプリ v1"
publishDate: 2026-01-04
description: "所属する軽音サークルのために開発した公式ホームページ兼部員向けWebアプリ(v1)"
tags:
  - "Next.js"
  - "TypeScript"
  - "Hono"
  - "Cloudflare"
imageUrl: "/images/product/ashitabo-v1.png"
includeInSkillsheet: true
skillsheet:
  summary: "Next.jsとHonoを用いて軽音サークル公式サイト兼会員向けWebアプリを再構築し、Next.jsのヘッドロックを解消。"
  period: "2025-11-01/2026-01-04"
  responsibilities:
    - "Next.jsからの技術移行計画と情報設計の立案"
    - "a11y/UI/UXの改善を目的としReactコンポーネントを再実装"
    - "バックエンドをHonoに移行しAPI開発と運用"
  techStack:
    - "Next.js 16 + TypeScript | Server ActionsをBFFとして活用した構成"
    - "Hono + Workers | 軽量かつ高速なバックエンドAPIサーバー構築"
  deliverables:
    - label: "あしたぼホームページ"
      url: "https://www.ashitabo.net"
---

## 概要

所属大学軽音サークル「あしたぼ」向けに、旧来のPHP+CSV構成をリプレースしてモダンなWebアプリとして再構築したものを、Next.jsのヘッドロックを解消するために再度技術刷新。公開サイトと部員専用機能を一体化し、情報発信と部内オペレーションを同じ基盤で扱えるようにした。
バックエンドとフロントエンドの責務分離を進め、将来的な技術選択の自由度を高めた。

## 期間

2025-11-01/2026-01-04

## 使用技術

- Next.js 16 + TypeScript | Server ActionsをBFFとして活用した構成
- Hono + Workers | 軽量かつ高速なバックエンドAPIサーバー構築
- GitHub Packages | プライベートnpmパッケージで共通Zodスキーマを管理、API契約を型安全に

## 業務領域

- Next.jsからの技術移行計画と情報設計の立案
- a11y/UI/UXの改善を目的としReactコンポーネントを再実装
- バックエンドをHonoに移行しAPI開発と運用

## 工夫点

1. Next.js Server ActionsをBFFとして活用し、フロントエンドの負荷を軽減
2. Honoのミドルウェアで認証・バリデーション・エラーハンドリングを一元管理
3. GitHub PackagesでZodスキーマを共通化し、API契約の型安全性を確保

## 成果物

- [あしたぼホームページ](https://www.ashitabo.net)
- [GitHub - ashitaboliff/frontend](https://github.com/ashitaboliff/frontend)

## 余談

チームドキュメント整備や後輩への引き継ぎ体制は継続中。今後は日程調整機能や初期実装のリファクタリングを進め、サークル内で継続的に改善できる仕組みづくりを目指しているが全然進まない。2026年2月までにはなんとかしたい。

## 余談その2

Next.js => Honoを行った後に`React2Shell`が起きたのでスゴイ。