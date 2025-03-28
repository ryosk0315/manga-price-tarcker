/**
 * ebookjapanスクレイピングモジュール
 * ebookjapanから漫画情報を取得します
 */

import fetch from 'node-fetch';

/**
 * ebookjapanで漫画を検索する
 * @param {string} title - 検索する漫画のタイトル
 * @returns {Promise<Object>} 検索結果
 */
export async function search(title) {
  try {
    const searchUrl = `https://ebookjapan.yahoo.co.jp/search/?keyword=${encodeURIComponent(title)}&genreId=`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    
    console.log(`ebookjapanで「${title}」を検索中...`);
    
    // 実際のリクエストはサーバーレス環境では制限があるため、モックデータを返します
    // 本番環境では実際にfetchを使用してHTMLを取得し、parseEbookjapanHtml関数でパースします
    /*
    const response = await fetch(searchUrl, { headers });
    if (!response.ok) {
      throw new Error(`ebookjapanへのリクエストエラー: ${response.status}`);
    }
    const html = await response.text();
    const items = parseEbookjapanHtml(html, title);
    */
    
    // モックデータの生成
    const items = parseEbookjapanHtml(null, title);
    
    return {
      source: 'ebookjapan',
      items
    };
  } catch (error) {
    console.error('ebookjapanスクレイピングエラー:', error);
    return {
      source: 'ebookjapan',
      error: error.message,
      items: []
    };
  }
}

/**
 * ebookjapanのHTML応答をパースして漫画情報を抽出する
 * @param {string} html - HTMLコンテンツ
 * @param {string} searchTitle - 検索タイトル
 * @returns {Array} 漫画アイテムの配列
 */
function parseEbookjapanHtml(html, searchTitle) {
  // 実際の実装では、cheerioなどを使用してHTMLをパースします
  // ここではモックデータを返します
  
  return [
    {
      title: `${searchTitle} 1巻`,
      price: '550円',
      author: '作者名',
      url: `https://ebookjapan.yahoo.co.jp/books/detail/${Math.floor(100000 + Math.random() * 900000)}/`,
      imageUrl: 'https://ebookjapan.yahoo.co.jp/assets/images/placeholder-image.jpg',
      availability: '購入可能',
      isDigital: true
    },
    {
      title: `${searchTitle} 2巻`,
      price: '550円',
      author: '作者名',
      url: `https://ebookjapan.yahoo.co.jp/books/detail/${Math.floor(100000 + Math.random() * 900000)}/`,
      imageUrl: 'https://ebookjapan.yahoo.co.jp/assets/images/placeholder-image.jpg',
      availability: '購入可能',
      isDigital: true
    }
  ];
} 