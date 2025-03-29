// Amazon scraper module
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Search Amazon Japan for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL
    const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}+漫画&i=stripbooks`;
    
    console.log(`Amazonで検索中: ${searchUrl}`);
    
    // Get the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10秒タイムアウト
    });
    
    if (response.status !== 200) {
      throw new Error(`Amazon responded with status: ${response.status}`);
    }
    
    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // 複数のセレクタパターンを試す
    const selectors = [
      '.s-result-item[data-asin]:not([data-asin=""])',
      '.s-result-list .s-result-item',
      '.sg-col-inner .s-result-item'
    ];
    
    // 最初に見つかったものを使用
    let firstResult = null;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        firstResult = element;
        break;
      }
    }
    
    if (!firstResult) {
      console.log('Amazon: 商品が見つかりませんでした');
      return {
        error: 'No results found on Amazon'
      };
    }
    
    // Get the product ASIN (Amazon's product ID)
    const asin = firstResult.getAttribute('data-asin') || '';
    
    // Extract product details - 複数のセレクタパターンを試す
    let titleElement = null;
    const titleSelectors = [
      'h2 .a-link-normal',
      '.a-size-medium.a-color-base.a-text-normal',
      '.a-link-normal .a-text-normal',
      '.a-link-normal'
    ];
    
    for (const selector of titleSelectors) {
      const element = firstResult.querySelector(selector);
      if (element && element.textContent.trim()) {
        titleElement = element;
        break;
      }
    }
    
    let priceElement = null;
    const priceSelectors = [
      '.a-price .a-offscreen',
      '.a-price',
      '.a-color-base.a-text-normal'
    ];
    
    for (const selector of priceSelectors) {
      const element = firstResult.querySelector(selector);
      if (element && element.textContent.trim()) {
        priceElement = element;
        break;
      }
    }
    
    let imageElement = firstResult.querySelector('img.s-image') || 
                      firstResult.querySelector('.s-image') || 
                      firstResult.querySelector('img');
    
    // Format the result
    const result = {
      store: 'Amazon',
      title: titleElement ? titleElement.textContent.trim() : `${title} (Amazon)`,
      currency: 'JPY', // Amazon Japan uses JPY
      url: asin ? `https://www.amazon.co.jp/dp/${asin}` : searchUrl
    };
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/￥([\d,]+)/) || priceText.match(/([\d,]+)円/) || priceText.match(/([0-9.,]+)/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseInt(priceMatch[1].replace(/[,.]/g, ''), 10);
      } else {
        // デフォルト価格（見つからない場合）
        result.price = 500;
        result.isPriceEstimated = true;
      }
    } else {
      // デフォルト価格（プライス要素が見つからない場合）
      result.price = 500;
      result.isPriceEstimated = true;
    }
    
    // Add image URL if available
    if (imageElement && imageElement.hasAttribute('src')) {
      result.image = imageElement.getAttribute('src');
    }
    
    console.log(`Amazon検索結果: ${result.title}, ${result.price}円`);
    
    return result;
  } catch (error) {
    console.error('Amazon search error:', error.message);
    
    // 検索に失敗した場合、デフォルト結果を返す
    return {
      store: 'Amazon',
      title: `${title} (Amazon推定価格)`,
      price: 500,
      currency: 'JPY',
      url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`,
      isPriceEstimated: true,
      error: `Failed to search Amazon: ${error.message}`
    };
  }
}

export { search }; 