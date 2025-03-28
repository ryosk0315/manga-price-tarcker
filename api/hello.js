/**
 * シンプルなテスト用APIエンドポイント
 * 基本的なAPI機能とCORSの動作を確認するために使用します
 */

// CORS設定を適用するハンドラー
export default function handler(req, res) {
  // CORS ヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS リクエストに対しては 200 を返す
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET リクエスト以外は拒否
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // テスト用のレスポンスを返す
  const response = {
    message: 'Hello from Manga Price Tracker API!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
} 