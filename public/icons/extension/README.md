# Chrome拡張機能のアイコン

このディレクトリには、Chrome拡張機能用のアイコンを配置します。

## 必要なファイル

以下のファイルを配置してください：

1. `icon16.png` - 16x16ピクセルのアイコン
2. `icon48.png` - 48x48ピクセルのアイコン
3. `icon128.png` - 128x128ピクセルのアイコン

## 配置方法

1. アイコンファイルをこのディレクトリに配置します
2. `extension/assets` ディレクトリにコピーします

```bash
cp public/icons/extension/icon16.png extension/assets/
cp public/icons/extension/icon48.png extension/assets/
cp public/icons/extension/icon128.png extension/assets/
```

## アイコンの要件

- PNG形式
- 透明背景
- シンプルで認識しやすいデザイン
- 小さいサイズでも視認できること

既に作成したアイコンをここに配置し、拡張機能をビルドする際に使用してください。 