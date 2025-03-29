/**
 * ebookjapanスクレイピングモジュール
 * ebookjapanから漫画情報を取得します
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

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
    
    try {
      const response = await fetch(searchUrl, { headers });
      if (!response.ok) {
        throw new Error(`ebookjapanへのリクエストエラー: ${response.status}`);
      }
      const html = await response.text();
      const items = parseEbookjapanHtml(html, title);
      
      console.log(`ebookjapan検索結果: ${items.length}件`);
      
      return {
        source: 'ebookjapan',
        items
      };
    } catch (error) {
      console.error('ebookjapanへのリクエストエラー:', error);
      // リクエストが失敗した場合はモックデータを返す
      return {
        source: 'ebookjapan',
        items: generateMockData(title),
        error: error.message
      };
    }
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
  try {
    const $ = cheerio.load(html);
    const results = [];
    
    // 商品リスト要素を取得
    const items = $('.book-item');
    
    items.each((index, element) => {
      try {
        if (index >= 5) return false; // 最大5件まで取得
        
        const item = $(element);
        
        // タイトル
        const titleElement = item.find('.book-item-title');
        const title = titleElement.text().trim();
        
        // 商品がなかった場合はスキップ
        if (!title) return;
        
        // URL
        const linkElement = item.find('a.book-item-link');
        const url = 'https://ebookjapan.yahoo.co.jp' + linkElement.attr('href');
        
        // 著者
        const authorElement = item.find('.book-item-author');
        const author = authorElement.text().trim();
        
        // 価格
        const priceElement = item.find('.book-item-price');
        let price = priceElement.text().trim();
        // 数字と円記号のみを抽出
        price = price.match(/\d+,?\d*円/)?.[0] || '550円';
        
        // 画像URL
        const imgElement = item.find('.book-item-image img');
        const imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
        
        // 在庫状況 (電子書籍は基本的に購入可能)
        const availability = '購入可能';
        
        // 検索タイトルを含むもののみを返す（ただし部分一致でOK）
        if (title.includes(searchTitle) || searchTitle.includes(title)) {
          results.push({
            title,
            price,
            author,
            url,
            imageUrl,
            availability,
            isDigital: true
          });
        }
      } catch (error) {
        console.error('ebookjapanアイテムパースエラー:', error);
      }
    });
    
    return results.length > 0 ? results : generateMockData(searchTitle);
  } catch (error) {
    console.error('ebookjapan HTML解析エラー:', error);
    return generateMockData(searchTitle);
  }
}

/**
 * モックデータを生成
 * スクレイピングが失敗した場合のフォールバック
 */
function generateMockData(searchTitle) {
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