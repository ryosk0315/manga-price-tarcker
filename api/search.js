// Vercel Serverless Function for manga search
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { getExchangeRates } = require('./utils/currency');

// Scraper modules
const amazonScraper = require('./scrapers/amazon');
const bookwalkerScraper = require('./scrapers/bookwalker');
const rightstufScraper = require('./scrapers/rightstuf');

// Search cache (in-memory, will reset on each deployment)
let searchCache = {};

// Cache validity duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Main search API handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only support GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get search query
  const { title, currency } = req.query;
  
  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter' });
  }
  
  // Cache key
  const cacheKey = `${title}:${currency || 'JPY'}`;
  
  // Check cache
  if (searchCache[cacheKey] && searchCache[cacheKey].timestamp > Date.now() - CACHE_DURATION) {
    console.log('Returning cached result for', title);
    return res.status(200).json(searchCache[cacheKey].data);
  }
  
  try {
    console.log('Searching for', title);
    
    // Perform parallel searches across all stores
    const [amazonResults, bookwalkerResults, rightstufResults] = await Promise.allSettled([
      amazonScraper.search(title),
      bookwalkerScraper.search(title),
      rightstufScraper.search(title)
    ]);
    
    // Combine results
    const results = {
      amazon: amazonResults.status === 'fulfilled' ? amazonResults.value : { error: amazonResults.reason },
      bookwalker: bookwalkerResults.status === 'fulfilled' ? bookwalkerResults.value : { error: bookwalkerResults.reason },
      rightstuf: rightstufResults.status === 'fulfilled' ? rightstufResults.value : { error: rightstufResults.reason }
    };
    
    // Currency conversion if needed
    if (currency && currency !== 'JPY') {
      try {
        const rates = await getExchangeRates();
        
        // Convert each price to the requested currency
        for (const store in results) {
          if (results[store].price && results[store].currency) {
            const originalCurrency = results[store].currency;
            const originalPrice = results[store].price;
            
            // Only convert if we have the exchange rate
            if (rates[originalCurrency] && rates[currency]) {
              // Convert to the target currency
              const priceInUSD = originalPrice / rates[originalCurrency];
              results[store].price = priceInUSD * rates[currency];
              results[store].price = Math.round(results[store].price * 100) / 100; // Round to 2 decimal places
              results[store].originalPrice = originalPrice;
              results[store].originalCurrency = originalCurrency;
              results[store].currency = currency;
            }
          }
        }
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Continue without conversion if it fails
      }
    }
    
    // Cache the results
    searchCache[cacheKey] = {
      timestamp: Date.now(),
      data: results
    };
    
    // Clean up old cache entries (if over 100 entries)
    if (Object.keys(searchCache).length > 100) {
      const oldestKeys = Object.keys(searchCache)
        .sort((a, b) => searchCache[a].timestamp - searchCache[b].timestamp)
        .slice(0, 10); // Remove oldest 10 entries
      
      oldestKeys.forEach(key => delete searchCache[key]);
    }
    
    // Return results
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'An error occurred during search' });
  }
}; 