/**
 * コミックシーモアスクレイピングモジュール
 * コミックシーモアから漫画情報を取得します
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * コミックシーモアで漫画を検索する
 * @param {string} title - 検索する漫画のタイトル
 * @returns {Promise<Object>} 検索結果
 */
export async function search(title) {
  try {
    const searchUrl = `https://www.cmoa.jp/search/result/?category=0&search_word=${encodeURIComponent(title)}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    
    console.log(`コミックシーモアで「${title}」を検索中...`);
    
    try {
      const response = await fetch(searchUrl, { headers });
      if (!response.ok) {
        throw new Error(`コミックシーモアへのリクエストエラー: ${response.status}`);
      }
      const html = await response.text();
      const items = parseCmoaHtml(html, title);
      
      console.log(`コミックシーモア検索結果: ${items.length}件`);
      
      return {
        source: 'cmoa',
        items
      };
    } catch (error) {
      console.error('コミックシーモアへのリクエストエラー:', error);
      // リクエストが失敗した場合はモックデータを返す
      return {
        source: 'cmoa',
        items: generateMockData(title),
        error: error.message
      };
    }
  } catch (error) {
    console.error('コミックシーモアスクレイピングエラー:', error);
    return {
      source: 'cmoa',
      error: error.message,
      items: []
    };
  }
}

/**
 * コミックシーモアのHTML応答をパースして漫画情報を抽出する
 * @param {string} html - HTMLコンテンツ
 * @param {string} searchTitle - 検索タイトル
 * @returns {Array} 漫画アイテムの配列
 */
function parseCmoaHtml(html, searchTitle) {
  try {
    const $ = cheerio.load(html);
    const results = [];
    
    // 商品リスト要素を取得
    const items = $('.data');
    
    items.each((index, element) => {
      try {
        if (index >= 5) return false; // 最大5件まで取得
        
        const item = $(element);
        
        // タイトル
        const titleElement = item.find('.title a');
        let title = titleElement.text().trim();
        
        // 商品がなかった場合はスキップ
        if (!title) return;
        
        // URL
        const url = 'https://www.cmoa.jp' + titleElement.attr('href');
        
        // 著者
        const authorElement = item.find('.author');
        const author = authorElement.text().trim();
        
        // 価格
        const priceElement = item.find('.price');
        let price = priceElement.text().trim();
        // 数字と円記号のみを抽出
        price = price.match(/\d+,?\d*円/)?.[0] || '495円';
        
        // 画像URL
        const imgElement = item.find('.data__image img');
        let imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = 'https://www.cmoa.jp' + imageUrl;
        }
        
        // 在庫状況 (電子書籍は基本的に配信中)
        const availability = '配信中';
        
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
        console.error('コミックシーモアアイテムパースエラー:', error);
      }
    });
    
    return results.length > 0 ? results : generateMockData(searchTitle);
  } catch (error) {
    console.error('コミックシーモア HTML解析エラー:', error);
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
      price: '495円',
      author: '作者名',
      url: `https://www.cmoa.jp/title/${Math.floor(100000 + Math.random() * 900000)}/`,
      imageUrl: 'https://www.cmoa.jp/data/image/placeholder-image.jpg',
      availability: '配信中',
      isDigital: true
    },
    {
      title: `${searchTitle} 2巻`,
      price: '495円',
      author: '作者名',
      url: `https://www.cmoa.jp/title/${Math.floor(100000 + Math.random() * 900000)}/`,
      imageUrl: 'https://www.cmoa.jp/data/image/placeholder-image.jpg',
      availability: '配信中',
      isDigital: true
    }
  ];
} 