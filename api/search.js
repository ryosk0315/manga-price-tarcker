// 漫画価格検索API - シンプル版
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GETリクエスト以外は拒否
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'このエンドポイントはGETリクエストのみサポートしています'
    });
  }

  try {
    // クエリパラメータからタイトルを取得
    const { title } = req.query;
    
    // タイトルが指定されていない場合はエラーを返す
    if (!title) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'タイトルパラメータが必要です（例: /api/search?title=鬼滅の刃）'
      });
    }

    // モックデータを返す
    const mockResults = [
      {
        store: 'Amazon',
        title: `${title} 1巻`,
        price: 418,
        url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`,
        availability: true,
        imageUrl: 'https://via.placeholder.com/200x300?text=Amazon'
      },
      {
        store: '楽天ブックス',
        title: `${title} 1巻`,
        price: 429,
        url: `https://books.rakuten.co.jp/search?sty=on&g=001&vw=grid&s=1&o=0&k=${encodeURIComponent(title)}`,
        availability: true,
        imageUrl: 'https://via.placeholder.com/200x300?text=楽天'
      },
      {
        store: 'ebookjapan',
        title: `${title} 1巻（電子書籍）`,
        price: 400,
        url: `https://ebookjapan.yahoo.co.jp/search/?keyword=${encodeURIComponent(title)}`,
        availability: true,
        imageUrl: 'https://via.placeholder.com/200x300?text=ebookjapan'
      },
      {
        store: 'コミックシーモア',
        title: `${title} 1巻（電子書籍）`,
        price: 396,
        url: `https://www.cmoa.jp/search/?category=searchTitle&word=${encodeURIComponent(title)}`,
        availability: true,
        imageUrl: 'https://via.placeholder.com/200x300?text=シーモア'
      }
    ];
    
    // 結果を返す
    return res.status(200).json({
      title: title,
      timestamp: new Date().toISOString(),
      stores: mockResults
    });
    
  } catch (error) {
    console.error('検索エラー:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'サーバー内部でエラーが発生しました。しばらく待ってから再試行してください。'
    });
  }
} 