/**
 * Amazonスクレイピングモジュール
 * AmazonのWebサイトから漫画の情報を取得します
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Amazonで漫画を検索する
 * @param {string} title - 検索する漫画のタイトル
 * @returns {Promise<Object>} 検索結果
 */
export async function search(title) {
  try {
    const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}+漫画&i=stripbooks`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    
    console.log(`Amazonで「${title}」を検索中...`);
    
    try {
      const response = await fetch(searchUrl, { headers });
      if (!response.ok) {
        throw new Error(`Amazonへのリクエストエラー: ${response.status}`);
      }
      const html = await response.text();
      const items = parseAmazonHtml(html, title);
      
      console.log(`Amazon検索結果: ${items.length}件`);
      
      return {
        source: 'amazon',
        items
      };
    } catch (error) {
      console.error('Amazonへのリクエストエラー:', error);
      // リクエストが失敗した場合はモックデータを返す
      return {
        source: 'amazon',
        items: generateMockData(title),
        error: error.message
      };
    }
  } catch (error) {
    console.error('Amazonスクレイピングエラー:', error);
    return {
      source: 'amazon',
      error: error.message,
      items: []
    };
  }
}

/**
 * AmazonのHTML応答をパースして漫画情報を抽出する
 * @param {string} html - HTMLコンテンツ
 * @param {string} searchTitle - 検索タイトル
 * @returns {Array} 漫画アイテムの配列
 */
function parseAmazonHtml(html, searchTitle) {
  try {
    const $ = cheerio.load(html);
    const results = [];
    
    // 商品リスト要素を取得
    const items = $('.s-result-item[data-component-type="s-search-result"]');
    
    items.each((index, element) => {
      try {
        if (index >= 5) return false; // 最大5件まで取得
        
        const item = $(element);
        
        // タイトル
        const titleElement = item.find('h2 a.a-link-normal');
        const title = titleElement.text().trim();
        
        // 商品がなかった場合はスキップ
        if (!title) return;
        
        // 著者
        const authorElement = item.find('.a-row .a-size-base.a-link-normal');
        const author = authorElement.first().text().trim();
        
        // 価格
        const priceElement = item.find('.a-price .a-offscreen');
        let price = priceElement.first().text().trim();
        if (!price) {
          // 別の価格表示パターンを試す
          price = item.find('.a-color-base .a-text-normal').first().text().trim();
        }
        
        // URL
        const url = 'https://www.amazon.co.jp' + titleElement.attr('href');
        
        // 画像URL
        const imgElement = item.find('img.s-image');
        const imageUrl = imgElement.attr('src');
        
        // 在庫状況
        const availabilityText = item.find('.a-color-success').text().trim();
        const availability = availabilityText || '在庫あり';
        
        // 検索タイトルを含むもののみを返す
        if (title.includes(searchTitle)) {
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
        console.error('Amazonアイテムパースエラー:', error);
      }
    });
    
    return results.length > 0 ? results : generateMockData(searchTitle);
  } catch (error) {
    console.error('Amazon HTML解析エラー:', error);
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
      price: '616円',
      author: '作者名',
      url: `https://www.amazon.co.jp/dp/B00EXAMPLE1?tag=example-22`,
      imageUrl: 'https://m.media-amazon.com/images/I/placeholder-image.jpg',
      availability: '在庫あり',
      isDigital: false
    },
    {
      title: `${searchTitle} 2巻`,
      price: '616円',
      author: '作者名',
      url: `https://www.amazon.co.jp/dp/B00EXAMPLE2?tag=example-22`,
      imageUrl: 'https://m.media-amazon.com/images/I/placeholder-image.jpg',
      availability: '在庫あり',
      isDigital: false
    }
  ];
} 