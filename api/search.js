// 漫画価格検索API
import { searchAllStores } from './utils/scraper.js';

/**
 * 複数の書店サイトから漫画の価格情報を取得します
 */
export default async function handler(req, res) {
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
    const { title, mock } = req.query;
    
    // タイトルが指定されていない場合はエラーを返す
    if (!title) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'タイトルパラメータが必要です（例: /api/search?title=鬼滅の刃）'
      });
    }

    // モックモードフラグまたはパラメータが指定されている場合はモックデータを返す
    if (mock === 'true' || process.env.USE_MOCK_DATA === 'true') {
      const mockResults = getMockResults(title);
      return res.status(200).json({
        title: title,
        timestamp: new Date().toISOString(),
        stores: mockResults,
        note: 'モックデータを使用しています'
      });
    }

    // 書店サイトからのデータ取得を試みる
    try {
      // タイムアウト機能を追加
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('タイムアウト：データ取得に時間がかかりすぎています')), 8000);
      });
      
      // 実際のスクレイピングを行うが、タイムアウトも設定
      const results = await Promise.race([
        searchAllStores(title),
        timeoutPromise
      ]);
      
      return res.status(200).json(results);
    } catch (scrapingError) {
      console.error('スクレイピングエラー:', scrapingError);
      
      // スクレイピングに失敗した場合はフォールバックとしてモックデータを返す
      const mockResults = getMockResults(title);
      return res.status(200).json({
        title: title,
        timestamp: new Date().toISOString(),
        stores: mockResults,
        note: 'スクレイピングに失敗したため、モックデータを返しています'
      });
    }
    
  } catch (error) {
    console.error('検索エラー:', error);
    // エラーが発生した場合もモックデータを返す
    const title = req.query.title || '';
    const mockResults = getMockResults(title);
    return res.status(200).json({
      title: title,
      timestamp: new Date().toISOString(),
      stores: mockResults,
      note: 'エラーが発生したため、モックデータを返しています'
    });
  }
}

/**
 * フォールバック用のモックデータを生成
 */
function getMockResults(title) {
  return [
    {
      store: 'Amazon',
      title: `${title} 1巻`,
      price: '418円',
      url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`,
      availability: '在庫あり',
      imageUrl: 'https://via.placeholder.com/200x300?text=Amazon'
    },
    {
      store: '楽天ブックス',
      title: `${title} 1巻`,
      price: '429円',
      url: `https://books.rakuten.co.jp/search?sty=on&g=001&vw=grid&s=1&o=0&k=${encodeURIComponent(title)}`,
      availability: '在庫あり',
      imageUrl: 'https://via.placeholder.com/200x300?text=楽天'
    },
    {
      store: 'ebookjapan',
      title: `${title} 1巻（電子書籍）`,
      price: '400円',
      url: `https://ebookjapan.yahoo.co.jp/search/?keyword=${encodeURIComponent(title)}`,
      availability: '購入可能',
      imageUrl: 'https://via.placeholder.com/200x300?text=ebookjapan'
    },
    {
      store: 'コミックシーモア',
      title: `${title} 1巻（電子書籍）`,
      price: '396円',
      url: `https://www.cmoa.jp/search/?category=searchTitle&word=${encodeURIComponent(title)}`,
      availability: '配信中',
      imageUrl: 'https://via.placeholder.com/200x300?text=シーモア'
    }
  ];
} 