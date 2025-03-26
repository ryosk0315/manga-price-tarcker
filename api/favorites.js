// Vercel Serverless Function for favorites management
// Note: In a real implementation, this would connect to a database like MongoDB, PostgreSQL, etc.

// In-memory storage (for demo purposes only - will reset on each deployment)
const userFavorites = {};

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // POST: Add a manga to favorites
  if (req.method === 'POST') {
    try {
      const { userId, mangaId, title } = req.body;
      
      if (!userId || !mangaId) {
        return res.status(400).json({ error: 'Missing userId or mangaId' });
      }
      
      // Initialize user favorites if not exists
      if (!userFavorites[userId]) {
        userFavorites[userId] = [];
      }
      
      // Check if already in favorites
      const existingIndex = userFavorites[userId].findIndex(item => item.id === mangaId);
      
      if (existingIndex >= 0) {
        // Already in favorites, can update if needed
        userFavorites[userId][existingIndex] = {
          id: mangaId,
          title: title || userFavorites[userId][existingIndex].title,
          addedAt: userFavorites[userId][existingIndex].addedAt
        };
      } else {
        // Add to favorites
        userFavorites[userId].push({
          id: mangaId,
          title: title || 'Unknown Manga',
          addedAt: new Date().toISOString()
        });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return res.status(500).json({ error: 'Failed to add to favorites' });
    }
  }
  
  // GET: Retrieve user's favorites
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }
      
      // Return user's favorites or empty array if none
      return res.status(200).json(userFavorites[userId] || []);
    } catch (error) {
      console.error('Error retrieving favorites:', error);
      return res.status(500).json({ error: 'Failed to retrieve favorites' });
    }
  }
  
  // DELETE: Remove from favorites
  if (req.method === 'DELETE') {
    try {
      const { userId, mangaId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }
      
      // If mangaId is provided, remove specific manga
      if (mangaId && userFavorites[userId]) {
        userFavorites[userId] = userFavorites[userId].filter(item => item.id !== mangaId);
        return res.status(200).json({ success: true });
      }
      
      // If URL is /api/favorites/clear, clear all favorites
      if (req.url.endsWith('/clear') && userFavorites[userId]) {
        userFavorites[userId] = [];
        return res.status(200).json({ success: true });
      }
      
      return res.status(400).json({ error: 'Invalid delete request' });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return res.status(500).json({ error: 'Failed to remove from favorites' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}; 