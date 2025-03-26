// Currency utility module
const axios = require('axios');

// Cache for exchange rates
let exchangeRatesCache = {
  timestamp: 0,
  rates: null
};

// Cache duration (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Get exchange rates from an API
 * Uses free exchange rate API
 */
async function getExchangeRates() {
  const now = Date.now();
  
  // Return from cache if available and fresh
  if (exchangeRatesCache.rates && exchangeRatesCache.timestamp > now - CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }
  
  try {
    // Using a free exchange rate API - in production, consider using a proper API with an API key
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }
    
    const data = response.data;
    
    if (!data || !data.rates) {
      throw new Error('Invalid exchange rate data format');
    }
    
    // Update cache
    exchangeRatesCache = {
      timestamp: now,
      rates: data.rates
    };
    
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // If cache exists but is stale, return it anyway as fallback
    if (exchangeRatesCache.rates) {
      console.log('Using stale exchange rate cache as fallback');
      return exchangeRatesCache.rates;
    }
    
    // Hard-coded fallback rates if everything fails
    return {
      USD: 1,
      JPY: 150.27,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.37,
      AUD: 1.52
    };
  }
}

/**
 * Convert amount from one currency to another
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rates = await getExchangeRates();
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
  }
  
  // Convert via USD as base currency
  const amountInUSD = amount / rates[fromCurrency];
  const amountInTargetCurrency = amountInUSD * rates[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(amountInTargetCurrency * 100) / 100;
}

// Export functions
module.exports = {
  getExchangeRates,
  convertCurrency
}; 