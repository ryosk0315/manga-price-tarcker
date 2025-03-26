// Vercel Serverless Function for search history
// Note: In a real implementation, this would connect to a database like MongoDB, PostgreSQL, etc.

// In-memory storage (for demo purposes only - will reset on each deployment)
const searchHistory = {};

// 検索履歴API
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
  // 現時点ではクライアントサイドで履歴管理を行うためのモックレスポンスを返します
  
  // GETリクエスト - 履歴の取得（モック）
  if (req.method === 'GET') {
    return res.status(200).json({
      message: '履歴はクライアントサイドのローカルストレージで管理されます',
      instructions: 'このAPIはテスト用です。実際のデータはブラウザのローカルストレージに保存されます。'
    });
  }
  
  // POSTリクエスト - 履歴の追加（モック）
  if (req.method === 'POST') {
    return res.status(200).json({
      message: '履歴が追加されました（モック）',
      status: 'success'
    });
  }
  
  // DELETEリクエスト - 履歴の削除（モック）
  if (req.method === 'DELETE') {
    return res.status(200).json({
      message: '履歴が削除されました（モック）',
      status: 'success'
    });
  }
  
  // その他のHTTPメソッドは許可しない
  return res.status(405).json({ 
    error: 'Method not allowed',
    message: 'このエンドポイントはGET, POST, DELETEリクエストのみサポートしています'
  });
} 