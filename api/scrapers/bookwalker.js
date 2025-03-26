// BookWalker scraper module
const axios = require('axios');
const { JSDOM } = require('jsdom');

/**
 * Search BookWalker Japan for manga
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object>} - Search result with price info
 */
async function search(title) {
  try {
    // Format the search URL (BookWalker comic/manga category)
    const searchUrl = `https://bookwalker.jp/search/?qcat=2&word=${encodeURIComponent(title)}`;
    
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
    const firstResult = document.querySelector('.bookitem');
    
    if (!firstResult) {
      return {
        error: 'No results found on BookWalker'
      };
    }
    
    // Extract product details
    const titleElement = firstResult.querySelector('.book-title');
    const priceElement = firstResult.querySelector('.price');
    const linkElement = firstResult.querySelector('a.a-link');
    const imageElement = firstResult.querySelector('.book-img img');
    
    // Format the result
    const result = {
      title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
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
    }
    
    // Extract the price (remove currency symbol and commas)
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/([\d,]+)円/);
      
      if (priceMatch && priceMatch[1]) {
        result.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }
    }
    
    // Add image URL if available
    if (imageElement && imageElement.hasAttribute('data-srcset')) {
      // BookWalker often uses data-srcset for lazy loading
      const srcset = imageElement.getAttribute('data-srcset');
      const srcMatch = srcset.split(',')[0].trim().split(' ')[0];
      if (srcMatch) {
        result.image = srcMatch;
      }
    } else if (imageElement && imageElement.hasAttribute('src')) {
      result.image = imageElement.getAttribute('src');
    }
    
    return result;
  } catch (error) {
    console.error('BookWalker search error:', error);
    return {
      error: `Failed to search BookWalker: ${error.message}`
    };
  }
}

module.exports = {
  search
}; 