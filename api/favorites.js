// Vercel Serverless Function for favorites management
// Note: In a real implementation, this would connect to a database like MongoDB, PostgreSQL, etc.

// In-memory storage (for demo purposes only - will reset on each deployment)
const userFavorites = {};

// お気に入りAPI
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 注意: 実際のプロダクション環境では、サーバーサイドでのユーザー認証が必要です
  // 現時点ではクライアントサイドでお気に入り管理を行うためのモックレスポンスを返します
  
  // GETリクエスト - お気に入りの取得（モック）
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'お気に入りはクライアントサイドのローカルストレージで管理されます',
      instructions: 'このAPIはテスト用です。実際のデータはブラウザのローカルストレージに保存されます。'
    });
  }
  
  // POSTリクエスト - お気に入りの追加（モック）
  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'お気に入りが追加されました（モック）',
      status: 'success'
    });
  }
  
  // DELETEリクエスト - お気に入りの削除（モック）
  if (req.method === 'DELETE') {
    return res.status(200).json({
      message: 'お気に入りが削除されました（モック）',
      status: 'success'
    });
  }
  
  // その他のHTTPメソッドは許可しない
  return res.status(405).json({ 
    error: 'Method not allowed',
    message: 'このエンドポイントはGET, POST, DELETEリクエストのみサポートしています'
  });
} 