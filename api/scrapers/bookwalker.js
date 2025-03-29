// BookWalker scraper module
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Search BookWalker Japan for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL (BookWalker comic/manga category)
    const searchUrl = `https://bookwalker.jp/search/?qcat=2&word=${encodeURIComponent(title)}`;
    
    console.log(`BookWalkerで検索中: ${searchUrl}`);
    
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
      throw new Error(`BookWalker responded with status: ${response.status}`);
    }
    
    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // 複数のセレクタパターンを試す
    const selectors = [
      '.bookitem',
      '.book-item',
      '.list-item'
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
      console.log('BookWalker: 商品が見つかりませんでした');
      return {
        error: 'No results found on BookWalker'
      };
    }
    
    // Extract product details - 複数のセレクタパターンを試す
    let titleElement = null;
    const titleSelectors = [
      '.book-title',
      '.title',
      'h2',
      'h3'
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
      '.price',
      '.book-price',
      '.item-price'
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
      'a.a-link',
      'a',
      '.book-item a'
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
      '.book-img img',
      'img'
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
      store: 'BookWalker',
      title: titleElement ? titleElement.textContent.trim() : `${title} (BookWalker)`,
      currency: 'JPY', // BookWalker Japan uses JPY
    };
    
    // Extract the URL
    if (linkElement && linkElement.hasAttribute('href')) {
      const href = linkElement.getAttribute('href');
      if (href.startsWith('/')) {
        result.url = `https://bookwalker.jp${href}`;
      } else {
        result.url = href;
      }
    } else {
      result.url = searchUrl;
    }
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/([\d,]+)円/) || priceText.match(/¥([\d,]+)/) || priceText.match(/([0-9,.]+)/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseInt(priceMatch[1].replace(/[,.]/g, ''), 10);
      } else {
        // デフォルト価格（見つからない場合）
        result.price = 400;
        result.isPriceEstimated = true;
      }
    } else {
      // デフォルト価格（プライス要素が見つからない場合）
      result.price = 400;
      result.isPriceEstimated = true;
    }
    
    // Add image URL if available
    if (imageElement) {
      if (imageElement.hasAttribute('data-srcset')) {
        // BookWalker often uses data-srcset for lazy loading
        const srcset = imageElement.getAttribute('data-srcset');
        const srcMatch = srcset.split(',')[0].trim().split(' ')[0];
        if (srcMatch) {
          result.image = srcMatch;
        }
      } else if (imageElement.hasAttribute('data-src')) {
        result.image = imageElement.getAttribute('data-src');
      } else if (imageElement.hasAttribute('src')) {
        result.image = imageElement.getAttribute('src');
      }
    }
    
    console.log(`BookWalker検索結果: ${result.title}, ${result.price}円`);
    
    return result;
  } catch (error) {
    console.error('BookWalker search error:', error.message);
    
    // 検索に失敗した場合、デフォルト結果を返す
    return {
      store: 'BookWalker',
      title: `${title} (BookWalker推定価格)`,
      price: 400,
      currency: 'JPY',
      url: `https://bookwalker.jp/search/?qcat=2&word=${encodeURIComponent(title)}`,
      isPriceEstimated: true,
      error: `Failed to search BookWalker: ${error.message}`
    };
  }
}

export { search }; 