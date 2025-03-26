// Vercel Serverless Function for test search (returns mock data)

/**
 * Mock test data for manga search
 */
const mockData = {
  'one piece': {
    amazon: {
      title: 'One Piece, Vol. 98',
      price: 999,
      currency: 'JPY',
      url: 'https://www.amazon.co.jp/dp/4088824415',
      image: 'https://m.media-amazon.com/images/I/51QFvXvnsrL._SL500_.jpg'
    },
    bookwalker: {
      title: 'ONE PIECE 98',
      price: 460,
      currency: 'JPY',
      url: 'https://bookwalker.jp/de46af1c08-4e55-4e44-bf37-d48b6b49d8d2/',
      image: 'https://c.bookwalker.jp/thumbnailkaisou/4088824415.jpg'
    },
    rightstuf: {
      title: 'One Piece Manga Volume 98',
      price: 9.99,
      currency: 'USD',
      url: 'https://www.rightstufanime.com/One-Piece-Manga-Volume-98',
      image: 'https://www.rightstufanime.com/images/productImages/9781974722891_manga-one-piece-98-primary.jpg'
    }
  },
  'naruto': {
    amazon: {
      title: 'Naruto, Vol. 72',
      price: 484,
      currency: 'JPY',
      url: 'https://www.amazon.co.jp/dp/4088802128',
      image: 'https://m.media-amazon.com/images/I/51D4S-Y1dqL._SL500_.jpg'
    },
    bookwalker: {
      title: 'NARUTO -ナルト- 72',
      price: 460,
      currency: 'JPY',
      url: 'https://bookwalker.jp/de68c11e9d-b3cf-42ac-9520-2c6e7bafcb7f/',
      image: 'https://c.bookwalker.jp/thumbnailkaisou/4088802128.jpg'
    },
    rightstuf: {
      title: 'Naruto Manga Volume 72',
      price: 9.99,
      currency: 'USD',
      url: 'https://www.rightstufanime.com/Naruto-Manga-Volume-72',
      image: 'https://www.rightstufanime.com/images/productImages/9781421582849_manga-naruto-72-primary.jpg'
    }
  },
  'attack on titan': {
    amazon: {
      title: 'Attack on Titan, Vol. 34',
      price: 506,
      currency: 'JPY',
      url: 'https://www.amazon.co.jp/dp/4065219582',
      image: 'https://m.media-amazon.com/images/I/51DH4PMPCEL._SL500_.jpg'
    },
    bookwalker: {
      title: '進撃の巨人(34)',
      price: 481,
      currency: 'JPY',
      url: 'https://bookwalker.jp/de22e0e861-4c85-49cd-9ba1-a7937984a1cc/',
      image: 'https://c.bookwalker.jp/thumbnailkaisou/4065219582.jpg'
    },
    rightstuf: {
      title: 'Attack on Titan Manga Volume 34',
      price: 10.99,
      currency: 'USD',
      url: 'https://www.rightstufanime.com/Attack-on-Titan-Manga-Volume-34',
      image: 'https://www.rightstufanime.com/images/productImages/9781646512331_manga-attack-on-titan-34-primary.jpg'
    }
  },
  'default': {
    amazon: {
      title: 'Sample Manga',
      price: 500,
      currency: 'JPY',
      url: 'https://www.amazon.co.jp/sample',
      image: 'https://via.placeholder.com/150'
    },
    bookwalker: {
      title: 'サンプル漫画',
      price: 450,
      currency: 'JPY',
      url: 'https://bookwalker.jp/sample',
      image: 'https://via.placeholder.com/150'
    },
    rightstuf: {
      title: 'Sample Manga (English)',
      price: 9.99,
      currency: 'USD',
      url: 'https://www.rightstufanime.com/sample',
      image: 'https://via.placeholder.com/150'
    }
  }
};

/**
 * Main handler for test search API
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only support GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get search query
  const { title } = req.query;
  
  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter' });
  }
  
  // Simulate 500ms network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find matching data or use default
  const searchTitle = title.toLowerCase();
  let result;
  
  if (searchTitle.includes('one piece')) {
    result = mockData['one piece'];
  } else if (searchTitle.includes('naruto')) {
    result = mockData['naruto'];
  } else if (searchTitle.includes('attack on titan') || searchTitle.includes('shingeki')) {
    result = mockData['attack on titan'];
  } else {
    result = mockData['default'];
    
    // Customize the default result with the search title
    result.amazon.title = `${title} (Amazon)`;
    result.bookwalker.title = `${title} (BookWalker)`;
    result.rightstuf.title = `${title} (RightStuf)`;
  }
  
  return res.status(200).json(result);
}; 