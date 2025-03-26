// Vercel Serverless Function for manga search
import axios from 'axios';
import { JSDOM } from 'jsdom';
// import { getExchangeRates } from './utils/currency';

// Scraper modules (実装時にコメントアウトを解除)
// const amazonScraper = require('./scrapers/amazon');
// const bookwalkerScraper = require('./scrapers/bookwalker');
// const rightstufScraper = require('./scrapers/rightstuf');

// Search cache (in-memory, will reset on each deployment)
let searchCache = {};

// Cache validity duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Main search API handler
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
  const { title, currency } = req.query;
  
  if (!title) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'タイトルパラメータが必要です（例: /api/search?title=鬼滅の刃）'
    });
  }
  
  // Cache key
  const cacheKey = `${title}:${currency || 'JPY'}`;
  
  // Check cache
  if (searchCache[cacheKey] && searchCache[cacheKey].timestamp > Date.now() - CACHE_DURATION) {
    console.log('Returning cached result for', title);
    return res.status(200).json(searchCache[cacheKey].data);
  }
  
  try {
    console.log('Searching for', title);
    
    // 本番環境では実際のスクレイピングを行うが、現段階ではモックデータを使用
    const mockResults = await getMockResults(title);
    
    const results = {
      title: title,
      timestamp: new Date().toISOString(),
      stores: mockResults
    };
    
    /* 実際のスクレイピング処理 (将来実装)
    // Perform parallel searches across all stores
    const [amazonResults, bookwalkerResults, rightstufResults] = await Promise.allSettled([
      amazonScraper.search(title),
      bookwalkerScraper.search(title),
      rightstufScraper.search(title)
    ]);
    
    // Combine results
    const results = {
      amazon: amazonResults.status === 'fulfilled' ? amazonResults.value : { error: amazonResults.reason },
      bookwalker: bookwalkerResults.status === 'fulfilled' ? bookwalkerResults.value : { error: bookwalkerResults.reason },
      rightstuf: rightstufResults.status === 'fulfilled' ? rightstufResults.value : { error: rightstufResults.reason }
    };
    
    // Currency conversion if needed
    if (currency && currency !== 'JPY') {
      try {
        const rates = await getExchangeRates();
        
        // Convert each price to the requested currency
        for (const store in results) {
          if (results[store].price && results[store].currency) {
            const originalCurrency = results[store].currency;
            const originalPrice = results[store].price;
            
            // Only convert if we have the exchange rate
            if (rates[originalCurrency] && rates[currency]) {
              // Convert to the target currency
              const priceInUSD = originalPrice / rates[originalCurrency];
              results[store].price = priceInUSD * rates[currency];
              results[store].price = Math.round(results[store].price * 100) / 100; // Round to 2 decimal places
              results[store].originalPrice = originalPrice;
              results[store].originalCurrency = originalCurrency;
              results[store].currency = currency;
            }
          }
        }
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Continue without conversion if it fails
      }
    }
    */
    
    // Cache the results
    searchCache[cacheKey] = {
      timestamp: Date.now(),
      data: results
    };
    
    // Clean up old cache entries (if over 100 entries)
    if (Object.keys(searchCache).length > 100) {
      const oldestKeys = Object.keys(searchCache)
        .sort((a, b) => searchCache[a].timestamp - searchCache[b].timestamp)
        .slice(0, 10); // Remove oldest 10 entries
      
      oldestKeys.forEach(key => delete searchCache[key]);
    }
    
    // Return results
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('検索エラー:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'サーバー内部でエラーが発生しました。しばらく待ってから再試行してください。'
    });
  }
}

// モックデータを返す関数（開発用）
async function getMockResults(title) {
  // 実際のスクレイピングの代わりにモックデータを返す
  return [
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
} 