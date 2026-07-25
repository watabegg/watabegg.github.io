# Identityとローカル文書の運用

## データを置く場所

個人情報、学歴、職歴、職務経歴、スキルは、リポジトリ直下の `identity/` に保存します。このディレクトリはGitの追跡対象外です。Aboutと採用文書はこのIdentityを参照します。

Product記事は `src/content/products/` のMarkdownで管理します。Product記事とIdentity内の職務経歴は、同じ制作物を扱う場合も別のデータです。記事向けの説明と採用文書向けの説明を、それぞれの用途に合わせて独立して編集できます。

追跡される `identity.example/` には架空のデータだけを置きます。新しい環境では、次のコマンドで編集用の雛形を作成してください。

```bash
cp -R identity.example identity
pnpm identity:check
```

実データはGitから復元できません。`git clean -fdX` は無視された `identity/` も削除するため、実行前に別の暗号化された保管先へバックアップしてください。

## プロフィールと経歴

基本情報とスキルは `identity/profile.ts` に保存します。学歴、職歴、プロジェクトは `identity/experiences/` の下に1件ずつ保存します。

```text
identity/
├── profile.ts
└── experiences/
    ├── education-example.ts
    ├── employment-example.ts
    └── project-example.ts
```

各ファイルは `defineProfile()` または `defineExperience()` にデータを渡します。TypeScriptとZodがキー名、日付、URL、必須項目を検査します。利用できる全項目は `identity.example/` と `src/identity/schema.ts` を参照してください。

新しい経歴は、初期状態を `documents-only` とする生成コマンドから追加できます。

```bash
pnpm identity:new -- --id=project-example --kind=project
```

作成されたファイルの `TODO` を編集してください。同名ファイルは上書きされません。

## Identityの公開範囲

経歴の `exposure` は、Identityを参照する画面と文書の範囲だけを制御します。Product記事の有無には影響しません。

- **`public`**：Aboutと採用文書で使用します。現在のAboutは、このうち学歴と職歴だけを表示します。
- **`documents-only`**：スキルシート、履歴書、職務経歴書だけで使用します。

`public` の経歴で会社名や説明を匿名化する場合は、文書用の `organization` と `content` を正本として残し、完全な公開用データを `publicProjection` に記述します。`publicProjection` は部分mergeを行わないため、`content` の未指定項目が文書用データから公開側へ流れることはありません。`documents-only` の経歴には指定できません。

プロフィールの `person.documentOverride` は、氏名や連絡先だけを採用文書向けに差し替えます。`profile.documents` と電話番号は文書用データだけへ渡します。公開ページ向けの `getPublicIdentity()` からは型と実値の両方を除外し、公開成果物の検査でもprivate値として扱います。

Product記事と職務経歴は別々に書き、一方の文章変更がもう一方へ波及しないようにしています。`publicProjection` はIdentityを参照する画面の匿名化にだけ使用し、Product記事とのデータ共有には使用しません。

## Product記事と職務経歴の分類

現在のプロジェクトは次の規則で配置します。

- **職務経歴だけ**：未追跡Identity内で `documents-only` にしたプロジェクト
- **Product記事だけ**：`no-smoking`、`ashitabo`、`ashitabo-v1`、`watabegg`
- **両方に独立して配置**：`asuna-hp`、`makasete-lp`、`remove-ads`、`slidev-theme`

「両方に独立して配置」は共通データへの参照を意味しません。公開記事は `src/content/products/<slug>.md`、職務経歴は `identity/experiences/project-<slug>.ts` にそれぞれ完全な文章を持ちます。

非公開プロジェクトのIDや本文は、この追跡されるドキュメントへ列挙しません。分類の正本は未追跡Identityだけに置き、公開成果物の検査もそこから対象を導出します。

Product記事の雛形は `src/content/products/_template.md` です。記事を追加した後、`draft: false` にするか `draft` を削除すると、公開日を過ぎた記事がProduct一覧と詳細ページへ生成されます。

## ローカル文書

文書プレビューはローカル用の明示的な起動コマンドで有効にします。

```bash
pnpm documents:dev
```

起動後、`http://127.0.0.1:4321/documents/` から次の文書を確認できます。

- スキルシート
- 履歴書（顔写真なし）
- 職務経歴書

3種類のPDFは次のコマンドで生成します。

```bash
pnpm documents:pdf
```

出力先は `documents/output/` です。このディレクトリはGitの追跡対象でも公開ビルドの対象でもありません。1種類だけ生成する場合は `--only` を使います。

```bash
pnpm documents:pdf -- --only=resume
```

## 公開ビルドとデプロイ

`pnpm build:public` は実データを明示的に選び、文書ルートを登録せず、公開サイトだけを `dist/` に生成します。`pnpm verify:public` は文書ルート、PDF、文書専用文字列、Identityファイルのパスが成果物へ混入していないか検査します。公開Product記事にも現れる一般的な値は公開済みとして扱いますが、`publicProjection` で置き換えた元の会社名、見出し、要約は常にprivate値として検査します。CIだけは `pnpm build:example` で架空データを使います。

```bash
pnpm build:public
pnpm verify:public
```

`pnpm deploy` は公開ビルドと検査を完了してから、`dist/` のスナップショットだけをGitHub Pages用ブランチへ送ります。実データのある作業ツリーや文書用ビルド成果物は送信しません。

デプロイ時は、CI検証用の `IDENTITY_SOURCE=example` がshellに残っていても実データを使用します。また、push先が既定の `github.com/watabegg/watabegg-hp` と一致しない場合は停止します。移転などで意図的に変更する場合だけ、`PAGES_EXPECTED_REPOSITORY` または `--expected-repository` で新しい `host/owner/repository` を明示してください。

```bash
pnpm deploy
```

GitHub Pagesは初回のみ、公開元を `gh-pages` ブランチのルートへ変更する必要があります。GitHub Actionsは実データを持たず、架空データを使った検証だけを行います。

## 変更後の検査

Identityを変更したら、公開ビルドと文書生成の前に次の検査を実行します。

```bash
pnpm identity:check
```

公開範囲やProduct記事を変更した場合は、`pnpm build:public && pnpm verify:public` まで実行してください。Product記事を追加してもIdentityの経歴は自動作成されず、Identityの経歴を追加してもProduct記事は生成されません。
