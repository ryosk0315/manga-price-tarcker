// Vercel Serverless Function for test search (returns mock data)

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

// モックデータを生成（テスト用）
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

/**
 * Main handler for test search API
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only support GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'このエンドポイントはGETリクエストのみサポートしています'
    });
  }
  
  // Get search query
  const { title = 'ワンピース', currency = 'JPY', mode = 'auto' } = req.query;
  
  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter' });
  }
  
  // Simulate 500ms network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    console.log(`テスト検索: "${title}"`);
    
    // 強制的にモックデータを使用するモード
    if (mode === 'mock') {
      const mockStores = generateMockData(title);
      
      // モックデータの通貨換算
      for (const store of mockStores) {
        if (currency !== store.currency) {
          store.originalPrice = store.price;
          store.originalCurrency = store.currency;
          store.price = await convertCurrency(store.price, store.currency, currency);
          store.currency = currency;
        }
      }
      
      return res.status(200).json({
        title,
        timestamp: new Date().toISOString(),
        requestedCurrency: currency,
        stores: mockStores,
        isMockData: true,
        message: '⚠️ モックデータを表示しています。これはテスト用APIです。'
      });
    }
    
    // 各ストアでのテスト検索
    let stores = [];
    let errors = [];
    let usedMockData = false;
    
    try {
      // 各ストアでの検索を並列実行（タイムアウト10秒）
      const [amazonResult, bookwalkerResult, rightstufResult] = await Promise.allSettled([
        promiseWithTimeout(amazonSearch(title), 10000),
        promiseWithTimeout(bookwalkerSearch(title), 10000),
        promiseWithTimeout(rightstufSearch(title), 10000)
      ]);
      
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
      } else {
        const errorMsg = amazonResult.status === 'rejected' 
          ? amazonResult.reason.message
          : (amazonResult.value?.error || 'Unknown error');
        errors.push({ store: 'Amazon', error: errorMsg });
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
      } else {
        const errorMsg = bookwalkerResult.status === 'rejected' 
          ? bookwalkerResult.reason.message
          : (bookwalkerResult.value?.error || 'Unknown error');
        errors.push({ store: 'BookWalker', error: errorMsg });
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
      } else {
        const errorMsg = rightstufResult.status === 'rejected' 
          ? rightstufResult.reason.message
          : (rightstufResult.value?.error || 'Unknown error');
        errors.push({ store: 'RightStuf', error: errorMsg });
      }
    } catch (error) {
      console.error('Parallel search error:', error);
      errors.push({ general: error.message });
    }
    
    // 結果がない場合はモックデータを使用
    if (stores.length === 0) {
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
    console.log(`テスト検索完了: "${title}" (${stores.length}件の結果, ${errors.length}件のエラー)`);
    
    return res.status(200).json({
      title,
      timestamp: new Date().toISOString(),
      requestedCurrency: currency,
      stores,
      errors: errors.length > 0 ? errors : undefined,
      isMockData: usedMockData,
      message: '⚠️ これはテスト用APIです。本番環境では /api/search を使用してください。'
    });
    
  } catch (error) {
    console.error('テスト検索エラー:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'サーバー内部でエラーが発生しました。',
      detail: error.message
    });
  }
} 