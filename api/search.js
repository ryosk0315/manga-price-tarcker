// 漫画価格検索API
import { search as amazonSearch } from './scrapers/amazon.js';
import { search as bookwalkerSearch } from './scrapers/bookwalker.js';
import { search as rightstufSearch } from './scrapers/rightstuf.js';
import { convertCurrency } from './utils/currency.js';

// タイムアウト付きのPromise
function promiseWithTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

// モックデータを生成（スクレイピング失敗時のフォールバック）
function generateMockData(title) {
  return [
    {
      store: 'Amazon',
      title: `${title} 1巻`,
      price: 418,
      currency: 'JPY',
      url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`,
      image: 'https://via.placeholder.com/200x300?text=Amazon'
    },
    {
      store: 'BookWalker',
      title: `${title} 1巻（電子書籍）`,
      price: 400,
      currency: 'JPY',
      url: `https://bookwalker.jp/search/?qcat=2&word=${encodeURIComponent(title)}`,
      image: 'https://via.placeholder.com/200x300?text=BookWalker'
    },
    {
      store: 'RightStuf',
      title: `${title} Vol.1 (English)`,
      price: 9.99,
      currency: 'USD',
      url: `https://www.rightstufanime.com/search?keywords=${encodeURIComponent(title)}`,
      image: 'https://via.placeholder.com/200x300?text=RightStuf'
    }
  ];
}

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
    const { title, currency = 'JPY' } = req.query;
    
    // タイトルが指定されていない場合はエラーを返す
    if (!title) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'タイトルパラメータが必要です（例: /api/search?title=鬼滅の刃）'
      });
    }

    console.log(`検索開始: "${title}"`);
    
    // スクレイピングの試行（タイムアウト15秒）
    let stores = [];
    let usedMockData = false;
    
    try {
      // 各ストアでの検索を並列実行（タイムアウト付き）
      const [amazonResult, bookwalkerResult, rightstufResult] = await Promise.allSettled([
        promiseWithTimeout(amazonSearch(title), 15000),
        promiseWithTimeout(bookwalkerSearch(title), 15000),
        promiseWithTimeout(rightstufSearch(title), 15000)
      ]);
      
      // 結果を整形
      
      // Amazonの結果を追加
      if (amazonResult.status === 'fulfilled' && !amazonResult.value.error) {
        const result = amazonResult.value;
        // 通貨換算（必要な場合）
        if (currency !== result.currency) {
          result.originalPrice = result.price;
          result.originalCurrency = result.currency;
          result.price = await convertCurrency(result.price, result.currency, currency);
          result.currency = currency;
        }
        stores.push(result);
      }
      
      // BookWalkerの結果を追加
      if (bookwalkerResult.status === 'fulfilled' && !bookwalkerResult.value.error) {
        const result = bookwalkerResult.value;
        // 通貨換算（必要な場合）
        if (currency !== result.currency) {
          result.originalPrice = result.price;
          result.originalCurrency = result.currency;
          result.price = await convertCurrency(result.price, result.currency, currency);
          result.currency = currency;
        }
        stores.push(result);
      }
      
      // RightStufの結果を追加
      if (rightstufResult.status === 'fulfilled' && !rightstufResult.value.error) {
        const result = rightstufResult.value;
        // 通貨換算（必要な場合）
        if (currency !== result.currency) {
          result.originalPrice = result.price;
          result.originalCurrency = result.currency;
          result.price = await convertCurrency(result.price, result.currency, currency);
          result.currency = currency;
        }
        stores.push(result);
      }
    } catch (scrapingError) {
      console.error('スクレイピングエラーまたはタイムアウト:', scrapingError);
      // エラーログのみ記録（後続のフォールバック処理で対応）
    }
    
    // スクレイピングが失敗または結果が0件の場合、モックデータを使用
    if (stores.length === 0) {
      console.log(`スクレイピング失敗または結果なし - モックデータを使用: "${title}"`);
      stores = generateMockData(title);
      usedMockData = true;
      
      // モックデータの通貨換算
      for (const store of stores) {
        if (currency !== store.currency) {
          store.originalPrice = store.price;
          store.originalCurrency = store.currency;
          store.price = await convertCurrency(store.price, store.currency, currency);
          store.currency = currency;
        }
      }
    }

    // 結果を返す
    console.log(`検索完了: "${title}" (${stores.length}件のストア)`);
    return res.status(200).json({
      title: title,
      timestamp: new Date().toISOString(),
      requestedCurrency: currency,
      stores: stores,
      isMockData: usedMockData
    });
    
  } catch (error) {
    console.error('検索エラー:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'サーバー内部でエラーが発生しました。しばらく待ってから再試行してください。',
      detail: error.message
    });
  }
} 