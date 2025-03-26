// シンプルなAPIレスポンス
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // ルートへのアクセスの場合
  return res.status(200).json({
    message: 'Manga Price Tracker APIサーバーです',
    endpoints: [
      '/api/hello',
      '/api/test',
      '/api/search'
    ],
    documentation: 'https://github.com/ryosk0315/manga-price-tarcker'
  });
} 