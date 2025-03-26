// DOM要素
const priceAlertThresholdInput = document.getElementById('priceAlertThreshold');
const enableNotificationsCheckbox = document.getElementById('enableNotifications');
const currencySelect = document.getElementById('currencySelect');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const clearFavoritesButton = document.getElementById('clearFavoritesButton');
const resetSettingsButton = document.getElementById('resetSettingsButton');
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('statusMessage');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // 現在の設定を読み込む
  loadSettings();
  
  // イベントリスナーを設定
  saveButton.addEventListener('click', saveSettings);
  clearHistoryButton.addEventListener('click', clearHistory);
  clearFavoritesButton.addEventListener('click', clearFavorites);
  resetSettingsButton.addEventListener('click', resetSettings);
});

// 設定の読み込み
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'priceAlertThreshold',
      'enableNotifications',
      'currency'
    ]);
    
    // 値を設定
    if (settings.priceAlertThreshold !== undefined) {
      priceAlertThresholdInput.value = settings.priceAlertThreshold;
    }
    
    if (settings.enableNotifications !== undefined) {
      enableNotificationsCheckbox.checked = settings.enableNotifications;
    }
    
    if (settings.currency) {
      currencySelect.value = settings.currency;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

// 設定の保存
async function saveSettings() {
  try {
    // 入力値の検証
    const threshold = parseInt(priceAlertThresholdInput.value, 10);
    
    if (isNaN(threshold) || threshold < 1 || threshold > 90) {
      showStatus('Please enter a valid threshold between 1 and 90', 'error');
      return;
    }
    
    // 設定を保存
    await chrome.storage.local.set({
      priceAlertThreshold: threshold,
      enableNotifications: enableNotificationsCheckbox.checked,
      currency: currencySelect.value
    });
    
    // 通知処理のリセット
    await chrome.runtime.sendMessage({ type: 'checkPriceAlerts' });
    
    showStatus('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

// 検索履歴のクリア
async function clearHistory() {
  if (!confirm('Are you sure you want to clear all search history? This cannot be undone.')) {
    return;
  }
  
  try {
    const { searchHistory } = await chrome.storage.local.get('searchHistory');
    
    if (searchHistory) {
      await chrome.storage.local.set({ searchHistory: [] });
      showStatus('Search history cleared', 'success');
    } else {
      showStatus('No search history to clear', 'info');
    }
  } catch (error) {
    console.error('Failed to clear history:', error);
    showStatus('Failed to clear search history', 'error');
  }
}

// お気に入りのクリア
async function clearFavorites() {
  if (!confirm('Are you sure you want to remove all favorites? This cannot be undone.')) {
    return;
  }
  
  try {
    const { favoriteMangas } = await chrome.storage.local.get('favoriteMangas');
    
    if (favoriteMangas && favoriteMangas.length > 0) {
      await chrome.storage.local.set({ favoriteMangas: [] });
      showStatus('Favorites cleared', 'success');
      
      // サーバー上のお気に入りも削除する試み
      try {
        const { userId } = await chrome.storage.local.get('userId');
        
        if (userId) {
          await fetch(`https://your-vercel-deployment.vercel.app/api/favorites/clear`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
          });
        }
      } catch (serverError) {
        console.error('Failed to clear favorites on server:', serverError);
        // ローカルは消えているので続行
      }
    } else {
      showStatus('No favorites to clear', 'info');
    }
  } catch (error) {
    console.error('Failed to clear favorites:', error);
    showStatus('Failed to clear favorites', 'error');
  }
}

// 設定のリセット
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to default? This will not affect your favorites or search history.')) {
    return;
  }
  
  try {
    // デフォルト設定
    await chrome.storage.local.set({
      priceAlertThreshold: 10,
      enableNotifications: true,
      currency: 'JPY'
    });
    
    // 設定を再読み込み
    loadSettings();
    
    showStatus('Settings reset to default', 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

// ステータスメッセージの表示
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = ''; // クラスをリセット
  statusMessage.classList.add(type, 'visible');
  
  // 3秒後に非表示
  setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 3000);
} 