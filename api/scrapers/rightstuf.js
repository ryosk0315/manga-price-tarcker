// RightStuf scraper module
const axios = require('axios');
const { JSDOM } = require('jsdom');

/**
 * Search RightStufAnime for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL
    const searchUrl = `https://www.rightstufanime.com/search?keywords=${encodeURIComponent(title)}%20manga`;
    
    // Get the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      }
    });
    
    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Find the first product in search results
    const firstResult = document.querySelector('.product-item');
    
    if (!firstResult) {
      return {
        error: 'No results found on RightStuf'
      };
    }
    
    // Extract product details
    const titleElement = firstResult.querySelector('.product-item-title');
    const priceElement = firstResult.querySelector('.product-item-price .price-sales');
    const linkElement = firstResult.querySelector('.product-item-thumbnail a');
    const imageElement = firstResult.querySelector('.product-item-thumbnail img');
    
    // Format the result
    const result = {
      title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
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
    }
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/\$([\d.]+)/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseFloat(priceMatch[1]);
      }
    }
    
    // Add image URL if available
    if (imageElement && imageElement.hasAttribute('data-src')) {
      // RightStuf often uses data-src for lazy loading
      result.image = imageElement.getAttribute('data-src');
    } else if (imageElement && imageElement.hasAttribute('src')) {
      result.image = imageElement.getAttribute('src');
    }
    
    return result;
  } catch (error) {
    console.error('RightStuf search error:', error);
    return {
      error: `Failed to search RightStuf: ${error.message}`
    };
  }
}

module.exports = {
  search
}; 