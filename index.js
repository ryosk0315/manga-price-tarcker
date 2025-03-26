// APIエントリーポイント
const searchHandler = require('./api/search');
const testSearchHandler = require('./api/test-search');
const historyHandler = require('./api/history');
const favoritesHandler = require('./api/favorites');
const helloHandler = require('./api/hello');

// ルーティング
module.exports = (req, res) => {
  const { url } = req;
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS (preflight) リクエストを処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // URLに基づいて適切なハンドラーにルーティング
  if (url.startsWith('/api/hello')) {
    return helloHandler(req, res);
  }
  
  if (url.startsWith('/api/search')) {
    return searchHandler(req, res);
  }
  
  if (url.startsWith('/api/test-search')) {
    return testSearchHandler(req, res);
  }
  
  if (url.startsWith('/api/history')) {
    return historyHandler(req, res);
  }
  
  if (url.startsWith('/api/favorites')) {
    return favoritesHandler(req, res);
  }
  
  // ルートが見つからない場合
  return res.status(404).json({ error: 'Not found' });
}; 