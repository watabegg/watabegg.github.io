---
title: 'Next.js + Cloudflare R2で高パフォーマンスな認証ユーザー限定のセキュアな画像配信をした'
description: 'Next.jsのサーバーコンポーネントとCloudflare R2の署名付きURLを使って、認証ユーザーのみがアクセスできるセキュアな画像配信を実現する方法を解説します。'
tags: ['Next.js', 'cloudflare', 'Auth.js']
publishDate: 2025-06-10
---

## はじめに
:::note worn
注意
この記事はQiitaに投稿したものを、個人サイトに移行したものです。
:::

サークルの内部向けのWebサービスを開発しているwatabeggです。

大学のサークルなどに問わず、Webサービスにおいて、どうしても認証のあるユーザにしか見せたくない特定のコンテンツがあるはずです。

そんなコンテンツの秘匿をNext.js + Cloudflareで実装した際に、「どうすればセキュアかつ高速に実現できるか？」で少し悩みました。今回はその備忘録として記します。普通に穴があるかもしれないしベストプラクティスじゃないかもしれんけどその時はすみません！

:::note warn
注意
この記事は大枠をGemini 2.5 Proに書いてもらっています。
またその一部を人の手で修正しています。
:::

## この記事で実現すること
- ログインしているユーザーだけが画像を見られるようにする
- 画像のURLが外部に流出しても、直接アクセスされるのを防ぐ
- 大量の画像を表示するページでもパフォーマンスを損なわない
- `<img>` タグでも `next/image` の `<Image>` コンポーネントでも利用できる

## なぜこの方法か？ - 結論：サーバーコンポーネント + 署名付きURL
当初、Next.jsのMiddlewareで認証チェックをしようと考えました。しかし、**`<img>`タグからのリクエストはMiddlewareを通過せず**、断念。

次に、クライアントサイドで画像URLをリクエストするAPIを作る方法を検討しましたが、「画像一枚ごとにAPIアクセスが発生するのはパフォーマンス的に避けたい...」という壁にぶつかりました。

そこで採用したのが、**Next.jsのサーバーコンポーネントでCloudflare R2の「署名付きURL」を生成する**方法です。

### アーキテクチャの概要
この方法の処理フローは以下の通りです。

1.  ユーザーがNext.jsのページにアクセスします
2.  **サーバーコンポーネント内**で、Auth.jsを使ってユーザーが認証済みかチェックします
3.  認証済みであれば、表示したい画像ごとに、短時間だけ有効な**署名付きURL**をサーバーサイドで生成します
4.  この署名付きURLを`<img>`や`<Image>`コンポーネントの`src`属性にセットしたHTMLをクライアントに返します
5.  ブラウザは、その一時的に有効なURLを使ってCloudflare R2に画像を直接リクエストし、表示します

この方法なら、クライアント側での追加API呼び出しが不要で、セキュアな画像配信が可能です。

## 技術スタック
- **Next.js**: App Router
- **Auth.js (v5)**: 認証
- **Cloudflare R2**: プライベートなオブジェクトストレージ
- **AWS SDK for JavaScript v3**: R2のS3互換APIを操作するため

## 実装手順

### Step 1: Cloudflare R2の準備とAPIトークンの発行
まず、画像を保存するR2バケットをプライベート設定で作成しておきます。

次に、R2にアクセスするためのAPIトークンを発行します。

1.  Cloudflareダッシュボード > R2 > 「R2 API トークンの管理」
2.  「API トークンを作成する」をクリック
3.  権限は **「オブジェクトの読み取り」** を選択し、トークンを作成します

作成後に表示される「アクセスキーID」と「シークレットアクセスキー」をコピーします。

### Step 2: Next.jsプロジェクトの環境設定
まず、R2を操作するためのAWS SDKをインストールします。

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

次に、プロジェクトのルートに`.env.local`ファイルを作成し、先ほど取得したキーなどを設定します。

```env
# Cloudflare R2
R2_ACCOUNT_ID="YOUR_ACCOUNT_ID"
R2_ACCESS_KEY_ID="ここにコピーしたアクセスキーIDを貼り付け"
R2_SECRET_ACCESS_KEY="ここにコピーしたシークレットアクセスキーを貼り付け"
R2_BUCKET_NAME="YOUR_BUCKET_NAME"
```
`R2_ACCOUNT_ID`はR2の概要ページ右側で確認できます。

### Step 3: 署名付きURLを生成するヘルパー関数の作成
サーバーサイドで署名付きURLを簡単に生成するための関数を用意します。

`lib/r2.ts`などのファイルを作成しましょう。

```ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2のS3互換APIエンドポイントを指定してS3クライアントを初期化
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * R2オブジェクトの署名付きURLを生成する
 * @param key オブジェクトキー (例: 'images/my-photo.jpg')
 * @returns 署名付きURL
 */
export async function getSignedUrlForR2(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URLの有効期限を秒単位で設定（例: 300秒 = 5分）
  const signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });

  return signedUrl;
}
```

### Step 4: サーバーコンポーネントでの認証と画像表示
最後に、画像を表示するページをサーバーコンポーネントとして作成し、認証チェックとURL生成を行います。

```tsx
import { auth } from "@/auth"; // Auth.js v5のauth関数
import { getSignedUrlForR2 } from "@/lib/r2";
import Image from "next/image";
import { redirect } from "next/navigation";

// 表示したい画像のキー（R2上のファイルパス）のリスト
const imageKeys = [
  "gallery/image1.jpg",
  "gallery/image2.png",
  "gallery/image3.webp",
];

// このコンポーネントはサーバーコンポーネントである必要があります (async)
export default async function ProtectedGalleryPage() {
  // 1. ユーザーのセッションを確認
  const session = await auth();
  if (!session?.user) {
    // 認証されていない場合はログインページにリダイレクト
    redirect("/api/auth/signin");
  }

  // 2. 複数の画像の署名付きURLを並行して効率的に生成
  const signedUrls = await Promise.all(
    imageKeys.map(key => getSignedUrlForR2(key))
  );

  return (
    <div>
      <h1>会員限定ギャラリー</h1>
      <p>ようこそ、{session.user.name}さん！</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {signedUrls.map((url, index) => (
          <div key={index}>
            {/* next/image の <Image> コンポーネントを使用 */}
            <Image
              src={url}
              alt={`Protected image ${index + 1}`}
              width={400}
              height={300}
              style={{ objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 実際に
これで実装は完了です！

実際にサークルの内部向けWebサービスでは、利用登録を行ったユーザのみ見ることのできるコンテンツにて以下のように実装しています。

![実際の画面](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3471456/f1a2bcb4-3396-447c-aaab-5d9fd0082c71.png)

信じられんくらい雑な切り抜きですが、こんな感じでガチャが実装されています。
これが一番ハイコンテクストなSRだったので良かったです。ハイコンテクストなSR用意しててよかった～

この画像のURLは
```https://xxx.yyy.r2.cloudflarestorage.com/zzz/../SR_xx.png```
で配信されています。しかし実際にこのページにアクセスすると

![InvalidArgument](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3471456/faeda2c9-9902-458a-ad3e-e50b21ca6bc8.png)

と表示され、保護されていることが分かります。

またこの配信元のURL自体も、このWebサービスの登録者ページにアクセスしないと露出しない構造になっています。

## おわりに
Next.jsのサーバーコンポーネントとCloudflare R2の署名付きURLを組み合わせることで、パフォーマンスとセキュリティを両立したコンテンツ保護がスマートに実現できました。
Middlewareやクライアントサイドでの複雑な処理が不要になるため、コードもシンプルに保てます。

この記事が、同じような課題を持つ方の助けになれば幸いです。
