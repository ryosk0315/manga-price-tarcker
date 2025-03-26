// シンプルなテスト用API
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GETリクエストのみ対応
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // シンプルなレスポンスを返す
  return res.status(200).json({ 
    message: 'Hello from Manga Price Tracker API!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
} 