// RightStuf scraper module
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Search RightStufAnime for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL
    const searchUrl = `https://www.rightstufanime.com/search?keywords=${encodeURIComponent(title)}%20manga`;
    
    console.log(`RightStufで検索中: ${searchUrl}`);
    
    // Get the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10秒タイムアウト
    });
    
    if (response.status !== 200) {
      throw new Error(`RightStuf responded with status: ${response.status}`);
    }
    
    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // 複数のセレクタパターンを試す
    const selectors = [
      '.product-item',
      '.product-cell',
      '.item-cell',
      '.facets-item-cell-grid'
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
      console.log('RightStuf: 商品が見つかりませんでした');
      return {
        error: 'No results found on RightStuf'
      };
    }
    
    // Extract product details - 複数のセレクタパターンを試す
    let titleElement = null;
    const titleSelectors = [
      '.product-item-title',
      '.item-name',
      '.product-name',
      'h2.product-line-stock-description-view-cell-item-name',
      'a[itemprop="url"]'
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
      '.product-item-price .price-sales',
      '.product-views-price-lead',
      '.price-sales',
      '[itemprop="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = firstResult.querySelector(selector);
      if (element && element.textContent.trim()) {
        priceElement = element;
        break;
      }
    }
    
    // リンク要素
    let linkElement = null;
    const linkSelectors = [
      '.product-item-thumbnail a',
      'a[itemprop="url"]',
      'a.facets-item-cell-grid-link'
    ];
    
    for (const selector of linkSelectors) {
      const element = firstResult.querySelector(selector);
      if (element) {
        linkElement = element;
        break;
      }
    }
    
    // 画像要素
    let imageElement = null;
    const imageSelectors = [
      '.product-item-thumbnail img',
      'img.product-line-stock-description-view-cell-item-image',
      'img[itemprop="image"]'
    ];
    
    for (const selector of imageSelectors) {
      const element = firstResult.querySelector(selector);
      if (element) {
        imageElement = element;
        break;
      }
    }
    
    // Format the result
    const result = {
      store: 'RightStuf',
      title: titleElement ? titleElement.textContent.trim() : `${title} (RightStuf)`,
      currency: 'USD', // RightStuf uses USD
    };
    
    // Extract the URL
    if (linkElement && linkElement.hasAttribute('href')) {
      const href = linkElement.getAttribute('href');
      if (href.startsWith('/')) {
        result.url = `https://www.rightstufanime.com${href}`;
      } else {
        result.url = href;
      }
    } else {
      result.url = searchUrl;
    }
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/\$([\d.]+)/) || priceText.match(/([0-9.]+)/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseFloat(priceMatch[1]);
      } else {
        // デフォルト価格（見つからない場合）
        result.price = 9.99;
        result.isPriceEstimated = true;
      }
    } else {
      // デフォルト価格（プライス要素が見つからない場合）
      result.price = 9.99;
      result.isPriceEstimated = true;
    }
    
    // Add image URL if available
    if (imageElement) {
      if (imageElement.hasAttribute('data-src')) {
        // RightStuf often uses data-src for lazy loading
        result.image = imageElement.getAttribute('data-src');
      } else if (imageElement.hasAttribute('src')) {
        result.image = imageElement.getAttribute('src');
      }
    }
    
    console.log(`RightStuf検索結果: ${result.title}, $${result.price}`);
    
    return result;
  } catch (error) {
    console.error('RightStuf search error:', error.message);
    
    // 検索に失敗した場合、デフォルト結果を返す
    return {
      store: 'RightStuf',
      title: `${title} (RightStuf推定価格)`,
      price: 9.99,
      currency: 'USD',
      url: `https://www.rightstufanime.com/search?keywords=${encodeURIComponent(title)}`,
      isPriceEstimated: true,
      error: `Failed to search RightStuf: ${error.message}`
    };
  }
}

export { search }; 