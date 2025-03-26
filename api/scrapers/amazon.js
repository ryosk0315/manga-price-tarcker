// Amazon scraper module
const axios = require('axios');
const { JSDOM } = require('jsdom');

/**
 * Search Amazon Japan for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL
    const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}+漫画&i=stripbooks`;
    
    // Get the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      }
    });
    
    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Find the first product in search results
    const firstResult = document.querySelector('.s-result-item[data-asin]:not([data-asin=""])');
    
    if (!firstResult) {
      return {
        error: 'No results found on Amazon'
      };
    }
    
    // Get the product ASIN (Amazon's product ID)
    const asin = firstResult.getAttribute('data-asin');
    
    // Extract product details
    const titleElement = firstResult.querySelector('h2 .a-link-normal');
    const priceElement = firstResult.querySelector('.a-price .a-offscreen');
    const imageElement = firstResult.querySelector('img.s-image');
    
    // Format the result
    const result = {
      title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
      currency: 'JPY', // Amazon Japan uses JPY
      url: `https://www.amazon.co.jp/dp/${asin}`
    };
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/￥([\d,]+)/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }
    }
    
    // Add image URL if available
    if (imageElement && imageElement.hasAttribute('src')) {
      result.image = imageElement.getAttribute('src');
    }
    
    return result;
  } catch (error) {
    console.error('Amazon search error:', error);
    return {
      error: `Failed to search Amazon: ${error.message}`
    };
  }
}

module.exports = {
  search
}; 