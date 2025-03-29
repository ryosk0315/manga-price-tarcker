/**
 * 漫画価格追跡 Chrome拡張機能
 * バックグラウンドスクリプト
 */

// APIのベースURL
const API_BASE_URL = 'https://manga-price-tarcker.vercel.app/api';

// 検索履歴の最大保存数
const MAX_HISTORY_ITEMS = 10;

// 拡張機能のインストール/更新時の処理
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('拡張機能がインストールされました。理由:', details.reason);
  
  // 初期設定
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      notificationsEnabled: true,
      checkInterval: 24, // デフォルトは24時間ごと
      favoriteMangas: [],
      searchHistory: [],
      useMockData: true // デフォルトでモックデータを使用する
    });
    
    console.log('初期設定が完了しました');
  }
  
  // アラームの設定（価格チェック用）
  chrome.alarms.create('checkPrices', {
    periodInMinutes: 60 * 24 // 24時間ごと
  });
});

// アラームが発火したときの処理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPrices') {
    const { notificationsEnabled, favoriteMangas } = await chrome.storage.sync.get([
      'notificationsEnabled',
      'favoriteMangas'
    ]);
    
    if (notificationsEnabled && favoriteMangas.length > 0) {
      await checkPricesForFavorites(favoriteMangas);
    }
  }
});

/**
 * お気に入り漫画の価格をチェックする
 * @param {Array} favorites - お気に入り漫画のリスト
 */
async function checkPricesForFavorites(favorites) {
  for (const manga of favorites) {
    try {
      // APIから最新の価格情報を取得（モックデータを使用）
      const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(manga.title)}&mock=true`);
      
      if (!response.ok) {
        console.error(`API呼び出しエラー: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      // 前回の価格と比較して値下げがあれば通知
      if (data.stores && data.stores.length > 0) {
        for (const store of data.stores) {
          const previousPrice = manga.prices ? manga.prices[store.store] : null;
          const currentPrice = parsePriceToNumber(store.price);
          
          if (previousPrice && currentPrice < previousPrice) {
            // 値下げ通知
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '../assets/icon128.png',
              title: '漫画価格値下げ通知',
              message: `「${manga.title}」が${store.store}で値下げされました！\n${previousPrice}円→${currentPrice}円`,
              buttons: [{ title: '詳細を見る' }]
            });
          }
          
          // 価格情報を更新
          if (!manga.prices) manga.prices = {};
          manga.prices[store.store] = currentPrice;
        }
      }
    } catch (error) {
      console.error(`「${manga.title}」の価格チェック中にエラーが発生しました:`, error);
    }
  }
  
  // 更新した価格情報を保存
  await chrome.storage.sync.set({ favoriteMangas: favorites });
}

/**
 * 価格文字列を数値に変換する
 * @param {string} priceStr - 価格の文字列表現（例: "616円"）
 * @returns {number} - 価格の数値表現
 */
function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  
  // 数字以外の文字を削除して数値に変換
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(price) ? 0 : price;
}

/**
 * 検索履歴に新しい項目を追加
 * @param {string} title - 検索したマンガのタイトル
 */
async function addToSearchHistory(title) {
  const { searchHistory = [] } = await chrome.storage.sync.get('searchHistory');
  
  // 同じタイトルがすでに存在する場合は削除
  const filteredHistory = searchHistory.filter(item => item.title !== title);
  
  // 新しい履歴項目を先頭に追加
  const newHistory = [
    { title, timestamp: new Date().toISOString() },
    ...filteredHistory
  ].slice(0, MAX_HISTORY_ITEMS); // 最大数に制限
  
  await chrome.storage.sync.set({ searchHistory: newHistory });
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'searchManga') {
    searchManga(message.title)
      .then(data => {
        sendResponse({ success: true, data });
        // 検索履歴に追加
        addToSearchHistory(message.title);
      })
      .catch(error => {
        console.error('検索エラー:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // 非同期レスポンスを使用することを示す
  }
  
  if (message.action === 'getSearchHistory') {
    chrome.storage.sync.get('searchHistory')
      .then(data => sendResponse({ success: true, history: data.searchHistory || [] }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // 非同期レスポンスを使用することを示す
  }
});

/**
 * 漫画を検索する
 * @param {string} title - 検索するマンガのタイトル
 * @returns {Promise<Object>} - 検索結果
 */
async function searchManga(title) {
  try {
    // モックデータを常に使用するかどうかの設定を取得
    const { useMockData = true } = await chrome.storage.sync.get('useMockData');
    const mockParam = useMockData ? '&mock=true' : '';
    
    const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(title)}${mockParam}`);
    
    if (!response.ok) {
      throw new Error(`API呼び出しエラー: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('検索エラー:', error);
    throw error;
  }
} 