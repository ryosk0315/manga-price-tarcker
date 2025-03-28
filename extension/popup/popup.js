/**
 * 漫画価格追跡 Chrome拡張機能
 * ポップアップUI JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM要素
  const searchInput = document.getElementById('manga-title');
  const searchButton = document.getElementById('search-button');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error-message');
  const noResultsElement = document.getElementById('no-results');
  const searchResultsElement = document.getElementById('search-results');
  const resultTitleElement = document.getElementById('result-title');
  const resultStoresElement = document.getElementById('result-stores');
  const historyListElement = document.getElementById('history-list');
  const favoritesListElement = document.getElementById('favorites-list');
  const optionsButton = document.getElementById('options-button');
  
  // テンプレート
  const storeItemTemplate = document.getElementById('store-item-template');
  const historyItemTemplate = document.getElementById('history-item-template');
  const favoriteItemTemplate = document.getElementById('favorite-item-template');
  
  // 最新の検索結果を保持
  let currentSearchResult = null;
  
  // 検索履歴の読み込み
  loadSearchHistory();
  
  // お気に入りの読み込み
  loadFavorites();
  
  /**
   * 検索実行関数
   */
  async function performSearch(title) {
    if (!title.trim()) {
      return;
    }
    
    // UI状態のリセット
    hideElements([searchResultsElement, errorElement, noResultsElement]);
    showElement(loadingElement);
    
    try {
      // タブを結果タブに切り替え
      switchTab('results');
      
      // バックグラウンドスクリプトに検索リクエストを送信
      const response = await chrome.runtime.sendMessage({
        action: 'searchManga',
        title: title.trim()
      });
      
      // 結果の処理
      if (response.success) {
        currentSearchResult = response.data;
        displaySearchResults(response.data);
      } else {
        showError(response.error || '検索中にエラーが発生しました');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      showError('拡張機能エラー: ' + error.message);
    } finally {
      hideElement(loadingElement);
    }
  }
  
  /**
   * 検索結果の表示
   */
  function displaySearchResults(data) {
    if (!data || !data.stores || data.stores.length === 0) {
      showElement(noResultsElement);
      return;
    }
    
    // 結果タイトルの設定
    resultTitleElement.textContent = `「${data.title}」の価格情報`;
    
    // 店舗結果のクリア
    resultStoresElement.innerHTML = '';
    
    // 各店舗の結果を表示
    data.stores.forEach(store => {
      const storeElement = storeItemTemplate.content.cloneNode(true);
      
      // 店舗情報を設定
      storeElement.querySelector('.store-name').textContent = store.store;
      storeElement.querySelector('.store-price').textContent = store.price;
      storeElement.querySelector('.manga-title').textContent = store.title;
      storeElement.querySelector('.manga-availability').textContent = store.availability;
      
      // リンクの設定
      const visitButton = storeElement.querySelector('.visit-button');
      visitButton.href = store.url;
      
      // お気に入りボタンの設定
      const favoriteButton = storeElement.querySelector('.add-favorite');
      favoriteButton.dataset.title = data.title;
      favoriteButton.dataset.store = store.store;
      
      // お気に入りボタンのイベント
      favoriteButton.addEventListener('click', async () => {
        await addToFavorites(data.title, store);
        favoriteButton.classList.add('active');
      });
      
      // 結果に追加
      resultStoresElement.appendChild(storeElement);
    });
    
    showElement(searchResultsElement);
  }
  
  /**
   * 検索履歴の読み込み
   */
  async function loadSearchHistory() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSearchHistory'
      });
      
      if (response.success && response.history && response.history.length > 0) {
        displaySearchHistory(response.history);
      } else {
        historyListElement.innerHTML = '<p>履歴がありません</p>';
      }
    } catch (error) {
      console.error('履歴の読み込みエラー:', error);
      historyListElement.innerHTML = '<p class="error">履歴の読み込みに失敗しました</p>';
    }
  }
  
  /**
   * 検索履歴の表示
   */
  function displaySearchHistory(historyItems) {
    historyListElement.innerHTML = '';
    
    historyItems.forEach(item => {
      const historyElement = historyItemTemplate.content.cloneNode(true);
      
      historyElement.querySelector('.history-title').textContent = item.title;
      
      // 検索ボタンのイベント
      const searchAgainButton = historyElement.querySelector('.search-again');
      searchAgainButton.addEventListener('click', () => {
        searchInput.value = item.title;
        performSearch(item.title);
      });
      
      // 削除ボタンのイベント
      const removeButton = historyElement.querySelector('.remove-history');
      removeButton.addEventListener('click', async () => {
        await removeFromHistory(item.title);
        loadSearchHistory();
      });
      
      historyListElement.appendChild(historyElement);
    });
  }
  
  /**
   * 履歴から項目を削除
   */
  async function removeFromHistory(title) {
    try {
      const { searchHistory = [] } = await chrome.storage.sync.get('searchHistory');
      const updatedHistory = searchHistory.filter(item => item.title !== title);
      await chrome.storage.sync.set({ searchHistory: updatedHistory });
    } catch (error) {
      console.error('履歴削除エラー:', error);
    }
  }
  
  /**
   * お気に入りの読み込み
   */
  async function loadFavorites() {
    try {
      const { favoriteMangas = [] } = await chrome.storage.sync.get('favoriteMangas');
      
      if (favoriteMangas.length > 0) {
        displayFavorites(favoriteMangas);
      } else {
        favoritesListElement.innerHTML = '<p>お気に入りがありません</p>';
      }
    } catch (error) {
      console.error('お気に入りの読み込みエラー:', error);
      favoritesListElement.innerHTML = '<p class="error">お気に入りの読み込みに失敗しました</p>';
    }
  }
  
  /**
   * お気に入りの表示
   */
  function displayFavorites(favorites) {
    favoritesListElement.innerHTML = '';
    
    favorites.forEach(item => {
      const favoriteElement = favoriteItemTemplate.content.cloneNode(true);
      
      favoriteElement.querySelector('.favorite-title').textContent = item.title;
      
      // 検索ボタンのイベント
      const searchAgainButton = favoriteElement.querySelector('.search-again');
      searchAgainButton.addEventListener('click', () => {
        searchInput.value = item.title;
        performSearch(item.title);
      });
      
      // 削除ボタンのイベント
      const removeButton = favoriteElement.querySelector('.remove-favorite');
      removeButton.addEventListener('click', async () => {
        await removeFromFavorites(item.title);
        loadFavorites();
      });
      
      favoritesListElement.appendChild(favoriteElement);
    });
  }
  
  /**
   * お気に入りに漫画を追加
   */
  async function addToFavorites(title, storeData) {
    try {
      const { favoriteMangas = [] } = await chrome.storage.sync.get('favoriteMangas');
      
      // すでに存在する場合は更新
      const existingIndex = favoriteMangas.findIndex(item => item.title === title);
      
      if (existingIndex >= 0) {
        // 価格情報を更新
        if (!favoriteMangas[existingIndex].prices) {
          favoriteMangas[existingIndex].prices = {};
        }
        
        favoriteMangas[existingIndex].prices[storeData.store] = parsePriceToNumber(storeData.price);
        favoriteMangas[existingIndex].lastUpdated = new Date().toISOString();
      } else {
        // 新しいお気に入りとして追加
        const prices = {};
        prices[storeData.store] = parsePriceToNumber(storeData.price);
        
        favoriteMangas.push({
          title,
          prices,
          lastUpdated: new Date().toISOString()
        });
      }
      
      await chrome.storage.sync.set({ favoriteMangas });
      loadFavorites();
    } catch (error) {
      console.error('お気に入り追加エラー:', error);
    }
  }
  
  /**
   * お気に入りから削除
   */
  async function removeFromFavorites(title) {
    try {
      const { favoriteMangas = [] } = await chrome.storage.sync.get('favoriteMangas');
      const updatedFavorites = favoriteMangas.filter(item => item.title !== title);
      await chrome.storage.sync.set({ favoriteMangas: updatedFavorites });
    } catch (error) {
      console.error('お気に入り削除エラー:', error);
    }
  }
  
  /**
   * 価格文字列を数値に変換
   */
  function parsePriceToNumber(priceStr) {
    if (!priceStr) return 0;
    
    // 数字以外の文字を削除して数値に変換
    const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(price) ? 0 : price;
  }
  
  /**
   * タブの切り替え
   */
  function switchTab(tabId) {
    tabButtons.forEach(button => {
      if (button.dataset.tab === tabId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    tabContents.forEach(content => {
      if (content.id === `${tabId}-tab`) {
        showElement(content);
      } else {
        hideElement(content);
      }
    });
  }
  
  /**
   * 要素を表示
   */
  function showElement(element) {
    element.classList.remove('hidden');
  }
  
  /**
   * 要素を非表示
   */
  function hideElement(element) {
    element.classList.add('hidden');
  }
  
  /**
   * 複数要素を非表示
   */
  function hideElements(elements) {
    elements.forEach(hideElement);
  }
  
  /**
   * エラーメッセージを表示
   */
  function showError(message) {
    errorElement.querySelector('p').textContent = message;
    showElement(errorElement);
  }
  
  // 検索ボタンのイベント
  searchButton.addEventListener('click', () => {
    performSearch(searchInput.value);
  });
  
  // エンターキーでの検索
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      performSearch(searchInput.value);
    }
  });
  
  // タブ切り替えのイベント
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchTab(button.dataset.tab);
    });
  });
  
  // 設定ボタンのイベント
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}); 