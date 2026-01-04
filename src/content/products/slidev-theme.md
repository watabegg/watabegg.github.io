---
title: "塾の集団授業スライド作成用Slidevテーマ"
publishDate: 2026-01-04
description: "塾の集団授業スライドを効率化するために開発したSlidevテーマ"
tags:
  - "Web開発"
  - "Slidev"
  - "TypeScript"
  - "Vue.js"
  - "CSS"
  - "npm"
imageUrl: "https://raw.githubusercontent.com/watabegg/slidev-theme-watabegg/refs/heads/main/example/0.png"
includeInSkillsheet: true
skillsheet:
  summary: "Slidevによるスライド制作をテンプレート化し、日本語対応と授業でも使いやすいコンポーネントをセットにしたテーマをnpmで公開。"
  period: "2025-08-01/present"
  responsibilities:
    - "テーマ開発とコンポーネント設計、スタイルガイド作成"
    - "npm公開フローの構築とドキュメント執筆"
  techStack:
    - "Slidev | テーマスキャフォールドとレイアウトのカスタマイズ"
    - "Vue 3 + TypeScript | 授業用コンポーネントとアニメーションを実装"
    - "npm workspace | テーマの配布とバージョニングを整備"
  deliverables:
    - label: "GitHub - slidev-theme-watabegg"
      url: "https://github.com/watabegg/slidev-theme-watabegg"
    - label: "npm - slidev-theme-watabegg"
      url: "https://www.npmjs.com/package/slidev-theme-watabegg"
---

## 概要

アルバイト先である塾で、自身が集団授業を行う際、PowerPointなどを利用するのがだるく、Slidevベースのプレゼンテーションをテーマ化。日本語環境のフォント調整やテンプレート、再利用可能なVueコンポーネントをまとめ、npmで公開しました。以前は `slidev-theme-exam-prep` として公開していましたが、内容を大幅に刷新し、普通にめちゃくちゃ私用で `slidev-theme-watabegg` として再公開しています。

## 期間

2025-08-01/present

## 使用技術

- Slidev | テーマスキャフォールドとレイアウトのカスタマイズ
- Vue 3 + TypeScript | 授業用コンポーネントとアニメーションを実装
- npm workspace | テーマの配布とバージョニングを整備

## 業務領域

- テーマ開発とコンポーネント設計、スタイルガイド作成
- npm公開フローの構築とドキュメント執筆

## 工夫点

1. 日本語フォントと縦書き要件を満たすSlidevテーマを実装
2. 授業パターンをコンポーネント化し授業準備時間を大幅削減
3. CIでのリリース自動化を整備し更新作業を効率化

## 成果物

- [GitHub - slidev-theme-watabegg](https://github.com/watabegg/slidev-theme-watabegg)
- [npm - slidev-theme-watabegg](https://www.npmjs.com/package/slidev-theme-watabegg)

## 余談

初めてのnpm公開だったため、バージョニングやCHANGELOG運用を学習しながら運用。バグ修正と授業からのフィードバック(自分の使いやすさ)をもとに継続改善している。
