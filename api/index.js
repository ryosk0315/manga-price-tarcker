// APIのルートハンドラー
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // レスポンスを返す
  return res.status(200).json({
    message: 'Manga Price Tracker API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
} 