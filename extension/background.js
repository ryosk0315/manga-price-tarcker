// バックグラウンドサービスワーカー
// const API_BASE_URL = 'https://your-vercel-deployment.vercel.app/api';
// 以下のように変更（デプロイ後にVercelから提供されるURLに置き換えてください）
const API_BASE_URL = 'https://manga-price-tarcker.vercel.app/api';

// 初期化処理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Manga Price Tracker installed');
  
  // アラームの設定（毎日1回価格チェック）
  chrome.alarms.create('checkPrices', {
    periodInMinutes: 1440 // 24時間
  });
  
  // デフォルト設定の保存
  chrome.storage.local.set({
    priceAlertThreshold: 10, // デフォルト：10%オフ
    enableNotifications: true,
    favoriteMangas: [],
    searchHistory: [],
    currency: 'JPY' // デフォルト通貨
  });
});

// アラームが発生したときの処理
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    checkPriceAlerts();
  }
});

// 価格アラートのチェック
async function checkPriceAlerts() {
  try {
    // お気に入りの漫画情報を取得
    const { favoriteMangas, priceAlertThreshold, enableNotifications } = 
      await chrome.storage.local.get(['favoriteMangas', 'priceAlertThreshold', 'enableNotifications']);
    
    if (!favoriteMangas || favoriteMangas.length === 0) {
      return;
    }
    
    // お気に入りの各漫画について価格をチェック
    let alertCount = 0;
    
    for (const manga of favoriteMangas) {
      const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(manga.title)}`);
      
      if (!response.ok) {
        continue;
      }
      
      const priceData = await response.json();
      
      // 価格変動チェック
      for (const store in priceData) {
        const currentPrice = priceData[store].price;
        const regularPrice = manga.regularPrices?.[store] || currentPrice;
        
        // 価格が下がったかチェック
        if (regularPrice > 0 && currentPrice > 0) {
          const discountPercentage = Math.round((regularPrice - currentPrice) / regularPrice * 100);
          
          if (discountPercentage >= priceAlertThreshold) {
            alertCount++;
            
            // 通知が有効な場合
            if (enableNotifications) {
              chrome.notifications.create(`price-alert-${manga.id}-${store}`, {
                type: 'basic',
                iconUrl: '/assets/icon128.png',
                title: 'Manga Price Alert',
                message: `${manga.title} is now ${discountPercentage}% off at ${store}!`,
                priority: 1
              });
            }
            
            // 更新情報の保存
            manga.regularPrices = manga.regularPrices || {};
            manga.regularPrices[store] = regularPrice;
          }
        }
      }
    }
    
    // お気に入り情報の更新
    chrome.storage.local.set({ favoriteMangas });
    
    // バッジ表示更新
    if (alertCount > 0) {
      chrome.action.setBadgeText({ text: alertCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#FF5722' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}

// メッセージリスナー (popup/optionsページからの通信用)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'searchManga') {
    searchManga(message.title)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 非同期レスポンスのために true を返す
  }
  
  if (message.type === 'addToFavorites') {
    addToFavorites(message.manga)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (message.type === 'removeFromFavorites') {
    removeFromFavorites(message.mangaId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (message.type === 'checkPriceAlerts') {
    checkPriceAlerts()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// 漫画検索
async function searchManga(title) {
  try {
    // 設定から通貨情報を取得
    const { currency = 'JPY' } = await chrome.storage.local.get('currency');
    
    // APIを呼び出して検索
    const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(title)}&currency=${currency}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 検索履歴に保存
    const { searchHistory = [] } = await chrome.storage.local.get('searchHistory');
    const newSearch = {
      id: Date.now().toString(),
      title,
      timestamp: new Date().toISOString(),
      results: result
    };
    
    // 最大10件まで保存
    searchHistory.unshift(newSearch);
    if (searchHistory.length > 10) {
      searchHistory.pop();
    }
    
    await chrome.storage.local.set({ searchHistory });
    
    // サーバーにも検索履歴を保存
    try {
      await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: await getUserId(),
          search: newSearch
        })
      });
    } catch (serverError) {
      console.error('Failed to save search history to server:', serverError);
      // ローカル保存はできているので続行
    }
    
    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// お気に入りに追加
async function addToFavorites(manga) {
  try {
    const { favoriteMangas = [] } = await chrome.storage.local.get('favoriteMangas');
    
    // すでに追加済みかチェック
    if (!favoriteMangas.some(m => m.id === manga.id)) {
      favoriteMangas.push(manga);
      await chrome.storage.local.set({ favoriteMangas });
    
      // サーバーにも保存
      try {
        await fetch(`${API_BASE_URL}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: await getUserId(),
            mangaId: manga.id,
            title: manga.title
          })
        });
      } catch (serverError) {
        console.error('Failed to save favorite to server:', serverError);
        // ローカル保存はできているので続行
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw error;
  }
}

// お気に入りから削除
async function removeFromFavorites(mangaId) {
  try {
    const { favoriteMangas = [] } = await chrome.storage.local.get('favoriteMangas');
    const updatedFavorites = favoriteMangas.filter(manga => manga.id !== mangaId);
    
    await chrome.storage.local.set({ favoriteMangas: updatedFavorites });
    
    // サーバーからも削除
    try {
      await fetch(`${API_BASE_URL}/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: await getUserId(),
          mangaId
        })
      });
    } catch (serverError) {
      console.error('Failed to remove favorite from server:', serverError);
      // ローカル削除はできているので続行
    }
    
    return { success: true };
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw error;
  }
}

// ユーザーIDの取得（ない場合は生成）
async function getUserId() {
  const { userId } = await chrome.storage.local.get('userId');
  
  if (userId) {
    return userId;
  }
  
  // 新しいユーザーIDを生成
  const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  await chrome.storage.local.set({ userId: newUserId });
  
  return newUserId;
} 