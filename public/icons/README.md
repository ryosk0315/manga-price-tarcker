# Manga Price Tracker アイコン

このディレクトリには、Manga Price Trackerのアイコンファイルを配置します。

## 必要なアイコンサイズ

Chrome拡張機能で使用するには、以下のサイズのアイコンを用意することをお勧めします：

- 16x16 - ファビコンとして使用
- 32x32 - マウスオーバー時やメニューで使用
- 48x48 - 拡張機能ページで使用
- 128x128 - Chrome ウェブストアで使用

## ファイル命名規則

以下の命名規則に従ってください：

- `icon-16.png` - 16x16サイズのアイコン
- `icon-32.png` - 32x32サイズのアイコン
- `icon-48.png` - 48x48サイズのアイコン
- `icon-128.png` - 128x128サイズのアイコン

## manifest.jsonでの使用方法

アイコンを作成したら、Chrome拡張機能のmanifest.jsonで以下のように参照します：

```json
{
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

すでに作成済みのアイコンをここに配置してください。 