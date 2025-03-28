import { URL } from 'url';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// API ハンドラーをインポート
import helloHandler from './api/hello.js';
import searchHandler from './api/search.js';

// __dirname と同等の機能を ES Modules で実現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Webサーバーを作成
const server = createServer(async (req, res) => {
  // リクエストURLをパース
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  
  console.log(`リクエスト: ${req.method} ${pathname}`);
  
  try {
    // API エンドポイントのルーティング
    if (pathname.startsWith('/api/hello')) {
      return helloHandler(req, res);
    }
    
    // 検索 API
    if (pathname.startsWith('/api/search')) {
      return searchHandler(req, res);
    }
    
    // 静的ファイル配信のハンドリング
    if (pathname === '/' || pathname === '/index.html') {
      const content = await readFile(path.join(__dirname, 'public', 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    
    // その他の静的ファイル
    if (pathname.startsWith('/static/')) {
      try {
        const filePath = path.join(__dirname, 'public', pathname.slice(8));
        const content = await readFile(filePath);
        
        // Content-Type を取得
        const ext = path.extname(filePath).toLowerCase();
        const contentType = getContentType(ext);
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      } catch (err) {
        console.error(`静的ファイル読み込みエラー: ${err.message}`);
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('ファイルが見つかりません');
        return;
      }
    }
    
    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    
  } catch (error) {
    console.error('サーバーエラー:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

// ファイル拡張子に基づいて Content-Type を取得する関数
function getContentType(ext) {
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

// 環境変数から取得するか、デフォルトのポートを使用
const PORT = process.env.PORT || 3000;

// サーバーを起動
server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// Vercel Serverless Function としてエクスポート
export default server; 