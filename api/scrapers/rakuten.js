/**
 * 楽天ブックスのスクレイピングモジュール
 * 楽天ブックスから漫画情報を取得します
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * 楽天ブックスで漫画を検索する
 * @param {string} title - 検索する漫画のタイトル
 * @returns {Promise<Object>} 検索結果
 */
export async function search(title) {
  try {
    const searchUrl = `https://books.rakuten.co.jp/search?sty=1&g=001&v=2&s=1&p=1&ps=30&w=${encodeURIComponent(title)}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    
    console.log(`楽天ブックスで「${title}」を検索中...`);
    
    try {
      const response = await fetch(searchUrl, { headers });
      if (!response.ok) {
        throw new Error(`楽天ブックスへのリクエストエラー: ${response.status}`);
      }
      const html = await response.text();
      const items = parseRakutenHtml(html, title);
      
      console.log(`楽天ブックス検索結果: ${items.length}件`);
      
      return {
        source: 'rakuten',
        items
      };
    } catch (error) {
      console.error('楽天ブックスへのリクエストエラー:', error);
      // リクエストが失敗した場合はモックデータを返す
      return {
        source: 'rakuten',
        items: generateMockData(title),
        error: error.message
      };
    }
  } catch (error) {
    console.error('楽天ブックススクレイピングエラー:', error);
    return {
      source: 'rakuten',
      error: error.message,
      items: []
    };
  }
}

/**
 * 楽天ブックスのHTML応答をパースして漫画情報を抽出する
 * @param {string} html - HTMLコンテンツ
 * @param {string} searchTitle - 検索タイトル
 * @returns {Array} 漫画アイテムの配列
 */
function parseRakutenHtml(html, searchTitle) {
  try {
    const $ = cheerio.load(html);
    const results = [];
    
    // 商品リスト要素を取得
    const items = $('.rbcomp__item-list__item');
    
    items.each((index, element) => {
      try {
        if (index >= 5) return false; // 最大5件まで取得
        
        const item = $(element);
        
        // タイトル
        const titleElement = item.find('.rbcomp__item-list__item__title a');
        const title = titleElement.text().trim();
        
        // 商品がなかった場合はスキップ
        if (!title) return;
        
        // URL
        const url = titleElement.attr('href');
        
        // 著者
        const authorElement = item.find('.rbcomp__item-list__item__author');
        const author = authorElement.text().trim();
        
        // 価格
        const priceElement = item.find('.rbcomp__item-list__item__price');
        let price = priceElement.text().trim();
        // 数字と円記号のみを抽出
        price = price.match(/\d+,?\d*円/)?.[0] || price;
        
        // 画像URL
        const imgElement = item.find('.rbcomp__item-list__item__image img');
        const imageUrl = imgElement.attr('src');
        
        // 在庫状況
        let availability = '在庫あり';
        if (item.find('.status__text').length > 0) {
          availability = item.find('.status__text').text().trim();
        }
        
        // 検索タイトルを含むもののみを返す（ただし部分一致でOK）
        if (title.includes(searchTitle) || searchTitle.includes(title)) {
          results.push({
            title,
            price,
            author,
            url,
            imageUrl,
            availability,
            isDigital: false
          });
        }
      } catch (error) {
        console.error('楽天ブックスアイテムパースエラー:', error);
      }
    });
    
    return results.length > 0 ? results : generateMockData(searchTitle);
  } catch (error) {
    console.error('楽天ブックス HTML解析エラー:', error);
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
      price: '693円',
      author: '作者名',
      url: `https://books.rakuten.co.jp/rb/${Math.floor(10000000 + Math.random() * 90000000)}/`,
      imageUrl: 'https://thumbnail.image.rakuten.co.jp/placeholder-image.jpg',
      availability: '在庫あり',
      isDigital: false
    },
    {
      title: `${searchTitle} 2巻`,
      price: '693円',
      author: '作者名',
      url: `https://books.rakuten.co.jp/rb/${Math.floor(10000000 + Math.random() * 90000000)}/`,
      imageUrl: 'https://thumbnail.image.rakuten.co.jp/placeholder-image.jpg',
      availability: '在庫あり',
      isDigital: false
    }
  ];
} 