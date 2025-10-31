const CACHE_NAME = 'ihara-real-estate-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/favicon.ico',
  '/img/1.png',
  '/house1.jpg',
  '/house2.jpg'
];

// Service Workerのインストール時
self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Service Worker: Cache failed', err);
      })
  );
});

// Service Workerのアクティベート時（古いキャッシュの削除）
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ネットワークリクエストの処理（Cache First戦略）
self.addEventListener('fetch', event => {
  // Google Formsへのリクエストはキャッシュしない
  if (event.request.url.includes('docs.google.com')) {
    return;
  }

  // Google Mapsへのリクエストもキャッシュしない
  if (event.request.url.includes('maps.google.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにある場合はキャッシュから返す
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // キャッシュにない場合はネットワークから取得
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // HTMLファイルと画像のみキャッシュに追加
                if (event.request.url.match(/\.(html|jpg|jpeg|png|gif|ico|css|js)$/)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(err => {
            console.log('Service Worker: Fetch failed:', err);
            // オフライン時の代替コンテンツ
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// プッシュ通知の処理（将来の拡張用）
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : '新着情報があります',
    icon: '/img/1.png',
    badge: '/img/1.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '詳細を見る',
        icon: '/img/1.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('不動産屋いはら', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// バックグラウンド同期（オフライン時のフォーム送信用）
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(
      // 保存されたフォームデータを送信する処理
      // 実際の実装では IndexedDB などからデータを取得して送信
      console.log('Service Worker: Syncing contact form data')
    );
  }
});

// キャッシュサイズ管理
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// 定期的なキャッシュクリーンアップ
setInterval(() => {
  limitCacheSize(CACHE_NAME, 50);
}, 60000); // 1分ごと