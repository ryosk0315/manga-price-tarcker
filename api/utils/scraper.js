/**
 * スクレイパーユーティリティ
 * 複数の書店サイトからのデータを統合します
 */

// 各書店のスクレイピングモジュールを読み込み
import { search as amazonSearch } from '../scrapers/amazon.js';
import { search as rakutenSearch } from '../scrapers/rakuten.js';
import { search as ebookjapanSearch } from '../scrapers/ebookjapan.js';
import { search as cmoaSearch } from '../scrapers/cmoa.js';

/**
 * すべての書店から漫画を検索する
 * @param {string} title - 検索する漫画のタイトル
 * @returns {Promise<Object>} 統合された検索結果
 */
export async function searchAllStores(title) {
  try {
    console.log(`すべての書店で「${title}」を検索中...`);
    
    // 並列で各書店の検索を実行
    const results = await Promise.allSettled([
      amazonSearch(title),
      rakutenSearch(title),
      ebookjapanSearch(title),
      cmoaSearch(title)
    ]);
    
    // 結果を整形
    const storeResults = [];
    
    // Amazon結果の処理
    if (results[0].status === 'fulfilled' && results[0].value.items && results[0].value.items.length > 0) {
      const amazonItem = results[0].value.items[0];
      storeResults.push({
        store: 'Amazon',
        title: amazonItem.title,
        price: amazonItem.price,
        url: amazonItem.url,
        imageUrl: amazonItem.imageUrl,
        availability: amazonItem.availability
      });
    }
    
    // 楽天結果の処理
    if (results[1].status === 'fulfilled' && results[1].value.items && results[1].value.items.length > 0) {
      const rakutenItem = results[1].value.items[0];
      storeResults.push({
        store: '楽天ブックス',
        title: rakutenItem.title,
        price: rakutenItem.price,
        url: rakutenItem.url,
        imageUrl: rakutenItem.imageUrl,
        availability: rakutenItem.availability
      });
    }
    
    // ebookjapan結果の処理
    if (results[2].status === 'fulfilled' && results[2].value.items && results[2].value.items.length > 0) {
      const ebookItem = results[2].value.items[0];
      storeResults.push({
        store: 'ebookjapan',
        title: ebookItem.title,
        price: ebookItem.price,
        url: ebookItem.url,
        imageUrl: ebookItem.imageUrl,
        availability: ebookItem.availability,
        isDigital: ebookItem.isDigital
      });
    }
    
    // コミックシーモア結果の処理
    if (results[3].status === 'fulfilled' && results[3].value.items && results[3].value.items.length > 0) {
      const cmoaItem = results[3].value.items[0];
      storeResults.push({
        store: 'コミックシーモア',
        title: cmoaItem.title,
        price: cmoaItem.price,
        url: cmoaItem.url,
        imageUrl: cmoaItem.imageUrl,
        availability: cmoaItem.availability,
        isDigital: cmoaItem.isDigital
      });
    }
    
    return {
      title,
      timestamp: new Date().toISOString(),
      stores: storeResults
    };
    
  } catch (error) {
    console.error('検索エラー:', error);
    throw error;
  }
} 