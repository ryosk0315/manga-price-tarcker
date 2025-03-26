// Vercel Serverless Function for search history
// Note: In a real implementation, this would connect to a database like MongoDB, PostgreSQL, etc.

// In-memory storage (for demo purposes only - will reset on each deployment)
const searchHistory = {};

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle POST request to save search history
  if (req.method === 'POST') {
    try {
      const { userId, search } = req.body;
      
      if (!userId || !search) {
        return res.status(400).json({ error: 'Missing userId or search data' });
      }
      
      // Initialize user history if not exists
      if (!searchHistory[userId]) {
        searchHistory[userId] = [];
      }
      
      // Add search to user's history
      searchHistory[userId].unshift({
        id: search.id || Date.now().toString(),
        title: search.title,
        timestamp: search.timestamp || new Date().toISOString(),
        results: search.results
      });
      
      // Limit to 20 entries per user
      if (searchHistory[userId].length > 20) {
        searchHistory[userId] = searchHistory[userId].slice(0, 20);
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving search history:', error);
      return res.status(500).json({ error: 'Failed to save search history' });
    }
  }
  
  // Handle GET request to retrieve search history
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }
      
      // Return user's history or empty array if none
      return res.status(200).json(searchHistory[userId] || []);
    } catch (error) {
      console.error('Error retrieving search history:', error);
      return res.status(500).json({ error: 'Failed to retrieve search history' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}; 