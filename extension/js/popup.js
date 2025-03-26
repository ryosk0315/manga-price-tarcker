// DOM要素
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const resultsTable = document.getElementById('resultsTable');
const addToFavoritesButton = document.getElementById('addToFavoritesButton');
const favoritesContainer = document.getElementById('favoritesContainer');
const favoritesList = document.getElementById('favoritesList');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');
const optionsButton = document.getElementById('optionsButton');
const tabButtons = document.querySelectorAll('.tab-button');

// APIエンドポイント
const API_BASE_URL = 'https://manga-price-tarcker.vercel.app/api';

// 現在の検索結果
let currentSearchResult = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // 検索ボタンのイベントリスナー
  searchButton.addEventListener('click', performSearch);
  
  // Enterキーでの検索
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // お気に入り追加ボタン
  addToFavoritesButton.addEventListener('click', addToFavorites);
  
  // オプションボタン
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // タブ切り替え
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // 初期データの読み込み
  loadFavorites();
  loadHistory();
});

// 検索実行
async function performSearch() {
  const title = searchInput.value.trim();
  
  if (!title) {
    showError('漫画のタイトルを入力してください');
    return;
  }
  
  // UIの更新
  showLoading();
  hideError();
  
  try {
    // APIから検索結果を取得
    const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(title)}`);
    const result = await response.json();
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    // 検索結果の表示
    displaySearchResults(title, result);
    
    // 現在の結果を保存
    currentSearchResult = {
      id: Date.now().toString(),
      title,
      results: result
    };
    
    // 検索履歴に追加
    addToHistory(currentSearchResult);
    
    // お気に入りボタン表示
    addToFavoritesButton.classList.remove('hidden');
    
  } catch (error) {
    showError(error.message || '検索に失敗しました');
  } finally {
    hideLoading();
  }
}

// 検索結果の表示
function displaySearchResults(title, results) {
  // 結果コンテナを表示
  resultsContainer.classList.remove('hidden');
  
  // 結果テーブルのHTML構築
  let html = `
    <h3>${title}</h3>
    <table>
      <thead>
        <tr>
          <th>ストア</th>
          <th>価格</th>
          <th>リンク</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // 各ストアの結果を追加
  let hasResults = false;
  
  if (results.stores && Array.isArray(results.stores)) {
    hasResults = results.stores.length > 0;
    
    results.stores.forEach(store => {
      html += `
        <tr>
          <td>${store.store}</td>
          <td>${store.price}円</td>
          <td>
            ${store.url 
              ? `<a href="${store.url}" target="_blank">開く</a>`
              : '利用不可'
            }
          </td>
        </tr>
      `;
    });
  }
  
  html += `
      </tbody>
    </table>
  `;
  
  if (!hasResults) {
    html = `<p>"${title}"の検索結果が見つかりませんでした</p>`;
  }
  
  // HTMLを挿入
  resultsTable.innerHTML = html;
}

// 履歴に追加
async function addToHistory(searchData) {
  try {
    // ローカルストレージから既存の履歴を取得
    const { searchHistory = [] } = await chrome.storage.local.get('searchHistory');
    
    // 新しい検索を先頭に追加
    searchHistory.unshift({
      ...searchData,
      timestamp: new Date().toISOString()
    });
    
    // 最大20件に制限
    if (searchHistory.length > 20) {
      searchHistory.pop();
    }
    
    // 更新された履歴を保存
    await chrome.storage.local.set({ searchHistory });
    
    // 履歴表示を更新
    loadHistory();
    
  } catch (error) {
    console.error('履歴の保存に失敗しました:', error);
  }
}

// お気に入りに追加
async function addToFavorites() {
  if (!currentSearchResult) {
    return;
  }
  
  try {
    const result = await sendMessage({
      type: 'addToFavorites',
      manga: currentSearchResult
    });
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    // お気に入りリストを更新
    loadFavorites();
    
    // 成功メッセージ
    showMessage('Added to favorites!');
    
  } catch (error) {
    showError('Failed to add to favorites');
  }
}

// お気に入りの読み込み
async function loadFavorites() {
  try {
    const { favoriteMangas = [] } = await chrome.storage.local.get('favoriteMangas');
    
    if (favoriteMangas.length === 0) {
      favoritesList.innerHTML = '<p>No favorites yet</p>';
      return;
    }
    
    let html = '<ul class="favorites-list">';
    
    favoriteMangas.forEach(manga => {
      html += `
        <li>
          <div class="favorite-item">
            <span class="manga-title">${manga.title}</span>
            <button class="view-button" data-id="${manga.id}">View</button>
            <button class="remove-button" data-id="${manga.id}">Remove</button>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    
    // HTMLを挿入
    favoritesList.innerHTML = html;
    
    // ボタンにイベントリスナーを追加
    document.querySelectorAll('.view-button').forEach(button => {
      button.addEventListener('click', () => {
        const mangaId = button.getAttribute('data-id');
        viewFavorite(mangaId, favoriteMangas);
      });
    });
    
    document.querySelectorAll('.remove-button').forEach(button => {
      button.addEventListener('click', () => {
        const mangaId = button.getAttribute('data-id');
        removeFavorite(mangaId);
      });
    });
    
  } catch (error) {
    console.error('Failed to load favorites:', error);
    favoritesList.innerHTML = '<p>Failed to load favorites</p>';
  }
}

// 検索履歴の読み込み
async function loadHistory() {
  try {
    const { searchHistory = [] } = await chrome.storage.local.get('searchHistory');
    
    if (searchHistory.length === 0) {
      historyList.innerHTML = '<p>No search history yet</p>';
      return;
    }
    
    let html = '<ul class="history-list">';
    
    searchHistory.forEach(item => {
      const date = new Date(item.timestamp).toLocaleString();
      
      html += `
        <li>
          <div class="history-item">
            <span class="manga-title">${item.title}</span>
            <span class="search-date">${date}</span>
            <button class="search-again-button" data-title="${item.title}">Search Again</button>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    
    // HTMLを挿入
    historyList.innerHTML = html;
    
    // 検索ボタンにイベントリスナーを追加
    document.querySelectorAll('.search-again-button').forEach(button => {
      button.addEventListener('click', () => {
        const title = button.getAttribute('data-title');
        searchInput.value = title;
        performSearch();
        switchTab('search');
      });
    });
    
  } catch (error) {
    console.error('Failed to load history:', error);
    historyList.innerHTML = '<p>Failed to load search history</p>';
  }
}

// お気に入りを表示
function viewFavorite(mangaId, favorites) {
  const manga = favorites.find(m => m.id === mangaId);
  
  if (!manga) {
    return;
  }
  
  // タイトルを検索欄にセット
  searchInput.value = manga.title;
  
  // 検索結果があれば表示
  if (manga.results) {
    displaySearchResults(manga.title, manga.results);
    resultsContainer.classList.remove('hidden');
    currentSearchResult = manga;
  } else {
    // 再検索
    performSearch();
  }
  
  // 検索タブに切り替え
  switchTab('search');
}

// お気に入りから削除
async function removeFavorite(mangaId) {
  try {
    const result = await sendMessage({
      type: 'removeFromFavorites',
      mangaId
    });
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    // お気に入りリストを更新
    loadFavorites();
    
  } catch (error) {
    showError('Failed to remove from favorites');
  }
}

// タブ切り替え
function switchTab(tabName) {
  // タブボタンの状態更新
  tabButtons.forEach(button => {
    if (button.getAttribute('data-tab') === tabName) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // コンテンツの表示/非表示
  if (tabName === 'search') {
    resultsContainer.classList.remove('hidden');
    favoritesContainer.classList.add('hidden');
    historyContainer.classList.add('hidden');
  } else if (tabName === 'favorites') {
    resultsContainer.classList.add('hidden');
    favoritesContainer.classList.remove('hidden');
    historyContainer.classList.add('hidden');
  } else if (tabName === 'history') {
    resultsContainer.classList.add('hidden');
    favoritesContainer.classList.add('hidden');
    historyContainer.classList.remove('hidden');
  }
}

// バックグラウンドスクリプトにメッセージ送信
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || {});
      }
    });
  });
}

// ローディング表示
function showLoading() {
  loadingIndicator.classList.remove('hidden');
}

// ローディング非表示
function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

// エラー表示
function showError(message) {
  errorContainer.classList.remove('hidden');
  errorMessage.textContent = message;
}

// エラー非表示
function hideError() {
  errorContainer.classList.add('hidden');
}

// 一時的なメッセージ表示
function showMessage(message) {
  // エラーコンテナを使って一時的にメッセージを表示
  errorMessage.textContent = message;
  errorContainer.classList.remove('hidden');
  errorContainer.classList.add('success');
  
  // 3秒後に消える
  setTimeout(() => {
    errorContainer.classList.add('hidden');
    errorContainer.classList.remove('success');
  }, 3000);
} 