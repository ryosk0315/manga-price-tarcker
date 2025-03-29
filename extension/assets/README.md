# アイコンについて

このディレクトリには拡張機能用のアイコンファイルが含まれています：

- `icon.svg` - 元のSVGアイコンファイル
- `icon128.png` - Chrome拡張機能用の128x128サイズのアイコン

## アイコン変換方法

SVGからPNGへの変換には、以下のいずれかの方法を使用してください：

### オンラインツールを使用する場合：

1. [SVGOMG](https://jakearchibald.github.io/svgomg/) などのオンラインSVG最適化ツールでSVGを最適化
2. [SVG to PNG](https://svgtopng.com/) などのオンライン変換ツールでPNGに変換

### ブラウザで変換する場合：

1. SVGファイルをブラウザで開く
2. 右クリックして「名前を付けて画像を保存...」を選択
3. PNG形式で保存

### Nodeスクリプトを使用する場合：

```javascript
const fs = require('fs');
const svg2img = require('svg2img');

const svgContent = fs.readFileSync('./icon.svg', 'utf8');

svg2img(svgContent, {width: 128, height: 128}, function(error, buffer) {
  if (error) {
    console.error(error);
    return;
  }
  fs.writeFileSync('./icon128.png', buffer);
  console.log('PNG生成完了');
});
```

## 使用アイコンサイズ

Chrome拡張機能のアイコンには複数のサイズがありますが、このプロジェクトでは簡単のため128x128サイズのみを使用しています。必要に応じて以下のサイズも追加できます：

- 16x16 - ファビコンサイズ
- 48x48 - 拡張機能管理ページ用
- 128x128 - Chrome ウェブストア用 