# Manga Price Tracker

漫画の価格を複数のオンラインストアで比較するChrome拡張機能です。

## 機能

- Amazon、BookWalker、RightStufなど複数のオンラインストアから漫画価格を検索・比較
- 検索履歴の保存
- お気に入り機能
- 価格変動通知
- 通貨換算機能

## プロジェクト構造

```
manga-price-tracker/
├── extension/ # Chrome拡張機能本体
│   ├── assets/ # アイコンなどの画像ファイル
│   ├── css/ # スタイルシート
│   ├── js/ # 拡張機能用JavaScript
│   ├── popup/ # ポップアップUI
│   ├── pages/ # オプションページなど
│   ├── manifest.json # 拡張機能マニフェスト
│   └── background.js # バックグラウンドスクリプト
│
└── api/ # バックエンドAPI (Vercel)
    ├── search.js # メイン検索API
    ├── test-search.js # テスト用API
    ├── history.js # 検索履歴API
    ├── favorites.js # お気に入りAPI
    ├── scrapers/ # 各ストア用スクレイピングコード
    │   ├── amazon.js
    │   ├── bookwalker.js
    │   └── rightstuf.js
    └── utils/ # ユーティリティ関数
        └── currency.js # 通貨換算ユーティリティ
```

## 開発環境のセットアップ

### 拡張機能の開発

1. Chrome拡張機能をデバッグモードでロード：
   - Chrome で `chrome://extensions` を開く
   - 「デベロッパーモード」を有効にする
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、`extension` フォルダを選択

### API開発（Vercel）

1. Vercelアカウントを作成
2. Vercel CLIをインストール: `npm i -g vercel`
3. ローカルで開発する場合: `vercel dev`

## デプロイ

### Chrome拡張機能

1. `extension` フォルダをZIPファイルに圧縮
2. [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) に拡張機能をアップロード

### APIサーバー（Vercel）

1. GitHubにリポジトリをプッシュ
2. Vercelでプロジェクトをインポート
3. デプロイ設定を行い、デプロイボタンをクリック

## 利用技術

- Chrome Extension API
- JavaScript/HTML/CSS
- Vercel Serverless Functions
- JSDOM（スクレイピング）
- Axios（HTTP通信）

## 今後の展望

- より多くのオンラインストアに対応
- 検索結果のソートやフィルター機能
- 複数漫画シリーズの価格追跡
- 価格履歴のグラフ表示

## ライセンス

MIT

## 注意事項

- このプロジェクトはデモンストレーション目的で作成されています
- 実際にデプロイして使用する場合は、各ウェブサイトの利用規約を確認してください
- スクレイピングのコードは各サイトのHTMLが変更されると動作しなくなる可能性があります 