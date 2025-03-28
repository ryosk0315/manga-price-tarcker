/**
 * 漫画価格追跡 Chrome拡張機能
 * 設定ページ JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM要素
  const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
  const checkIntervalSelect = document.getElementById('check-interval');
  const favoritesCountElement = document.getElementById('favorites-count');
  const historyCountElement = document.getElementById('history-count');
  const clearHistoryButton = document.getElementById('clear-history');
  const clearFavoritesButton = document.getElementById('clear-favorites');
  const exportDataButton = document.getElementById('export-data');
  const importDataButton = document.getElementById('import-data');
  const importFileInput = document.getElementById('import-file');
  const saveSettingsButton = document.getElementById('save-settings');
  const saveMessageElement = document.getElementById('save-message');
  
  // 設定の読み込み
  await loadSettings();
  
  // データ件数の表示
  await updateCounts();
  
  /**
   * 設定を読み込む
   */
  async function loadSettings() {
    try {
      const { notificationsEnabled, checkInterval } = await chrome.storage.sync.get([
        'notificationsEnabled',
        'checkInterval'
      ]);
      
      // チェックボックスの状態を設定
      notificationsEnabledCheckbox.checked = notificationsEnabled !== false; // デフォルトはtrue
      
      // チェック間隔の選択状態を設定
      if (checkInterval) {
        checkIntervalSelect.value = checkInterval;
      } else {
        checkIntervalSelect.value = '24'; // デフォルト: 24時間
      }
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  }
  
  /**
   * データ件数を更新する
   */
  async function updateCounts() {
    try {
      const { favoriteMangas = [], searchHistory = [] } = await chrome.storage.sync.get([
        'favoriteMangas',
        'searchHistory'
      ]);
      
      favoritesCountElement.textContent = favoriteMangas.length;
      historyCountElement.textContent = searchHistory.length;
    } catch (error) {
      console.error('データ件数の取得エラー:', error);
    }
  }
  
  /**
   * 設定を保存する
   */
  async function saveSettings() {
    try {
      const settings = {
        notificationsEnabled: notificationsEnabledCheckbox.checked,
        checkInterval: parseInt(checkIntervalSelect.value, 10)
      };
      
      // ストレージに保存
      await chrome.storage.sync.set(settings);
      
      // アラームの更新
      await chrome.alarms.clear('checkPrices');
      
      if (settings.notificationsEnabled) {
        await chrome.alarms.create('checkPrices', {
          periodInMinutes: settings.checkInterval * 60 // 時間をminutes に変換
        });
      }
      
      // 保存メッセージの表示
      saveMessageElement.style.display = 'block';
      
      // 3秒後にメッセージを非表示
      setTimeout(() => {
        saveMessageElement.style.display = 'none';
      }, 3000);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      alert('設定の保存中にエラーが発生しました');
    }
  }
  
  /**
   * 検索履歴をクリアする
   */
  async function clearHistory() {
    if (confirm('検索履歴をすべて削除してもよろしいですか？')) {
      try {
        await chrome.storage.sync.set({ searchHistory: [] });
        await updateCounts();
        alert('検索履歴を削除しました');
      } catch (error) {
        console.error('検索履歴クリアエラー:', error);
        alert('検索履歴の削除中にエラーが発生しました');
      }
    }
  }
  
  /**
   * お気に入りをクリアする
   */
  async function clearFavorites() {
    if (confirm('お気に入りをすべて削除してもよろしいですか？この操作は元に戻せません。')) {
      try {
        await chrome.storage.sync.set({ favoriteMangas: [] });
        await updateCounts();
        alert('お気に入りを削除しました');
      } catch (error) {
        console.error('お気に入りクリアエラー:', error);
        alert('お気に入りの削除中にエラーが発生しました');
      }
    }
  }
  
  /**
   * データをエクスポートする
   */
  async function exportData() {
    try {
      const { favoriteMangas = [], searchHistory = [] } = await chrome.storage.sync.get([
        'favoriteMangas',
        'searchHistory'
      ]);
      
      const data = {
        favoriteMangas,
        searchHistory,
        exportDate: new Date().toISOString()
      };
      
      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `manga_price_tracker_data_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('データエクスポートエラー:', error);
      alert('データのエクスポート中にエラーが発生しました');
    }
  }
  
  /**
   * インポートファイル選択を開く
   */
  function openImportFile() {
    importFileInput.click();
  }
  
  /**
   * ファイルからデータをインポートする
   */
  async function importDataFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // データの検証
        if (!data.favoriteMangas || !data.searchHistory) {
          throw new Error('インポートデータの形式が無効です');
        }
        
        // 確認
        if (confirm('このデータをインポートすると既存のデータが上書きされます。続行しますか？')) {
          await chrome.storage.sync.set({
            favoriteMangas: data.favoriteMangas,
            searchHistory: data.searchHistory
          });
          
          alert('データのインポートが完了しました');
          await updateCounts();
        }
      } catch (error) {
        console.error('データインポートエラー:', error);
        alert('データのインポート中にエラーが発生しました: ' + error.message);
      }
      
      // ファイル選択をリセット
      importFileInput.value = '';
    };
    
    reader.readAsText(file);
  }
  
  // イベントリスナー
  saveSettingsButton.addEventListener('click', saveSettings);
  clearHistoryButton.addEventListener('click', clearHistory);
  clearFavoritesButton.addEventListener('click', clearFavorites);
  exportDataButton.addEventListener('click', exportData);
  importDataButton.addEventListener('click', openImportFile);
  importFileInput.addEventListener('change', importDataFromFile);
}); 