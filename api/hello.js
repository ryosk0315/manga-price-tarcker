// シンプルなテスト用API
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // レスポンスを返す
  return res.status(200).json({ 
    message: 'Hello from Manga Price Tracker API!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
} 