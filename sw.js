/**
 * Service Worker for 스도쿠 PWA
 * 오프라인 지원 및 캐싱 기능 제공
 */

// 매 배포마다 이 버전을 변경하세요!
const CACHE_VERSION = 'v2025-01-16-1';
const CACHE_NAME = `sudoku-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `sudoku-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `sudoku-dynamic-${CACHE_VERSION}`;

// GitHub Pages 경로에 맞게 수정된 정적 파일들
const STATIC_FILES = [
  '/sudoku/',
  '/sudoku/index.html',
  '/sudoku/css/style.css',
  '/sudoku/js/app.js',
  '/sudoku/js/game.js',
  '/sudoku/js/ui.js',
  '/sudoku/js/storage.js',
  '/sudoku/js/audioManager.js',
  '/sudoku/js/security.js',
  '/sudoku/js/smartHints.js',
  '/sudoku/js/dailyChallenge.js',
  '/sudoku/js/achievements.js',
  '/sudoku/js/autoSolver.js',
  '/sudoku/js/aiDifficulty.js',
  '/sudoku/js/userAnalytics.js',
  '/sudoku/js/pwaManager.js',
  '/sudoku/js/shop.js',
  '/sudoku/js/themeManager.js',
  '/sudoku/js/trophyRewards.js',
  '/sudoku/js/levelSystem.js',
  '/sudoku/manifest.json',
  '/sudoku/icons/icon-192x192.svg',
  '/sudoku/icons/icon-512x512.svg'
];

// 동적 파일들 (필요할 때 캐시할 파일들)
const DYNAMIC_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:js|css)$/,
  /\.(?:woff|woff2|ttf|eot)$/
];

/**
 * Service Worker 설치
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  // 설치 직후 대기 없이 새 워커 활성화 준비
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );
});

/**
 * Service Worker 활성화
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      // 예전 캐시 정리
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== STATIC_CACHE_NAME && k !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          }
        })
      );
      
      // 열린 탭 즉시 새 워커가 제어
      await self.clients.claim();
      console.log('[SW] Service Worker activated and claimed clients');
    })()
  );
});

/**
 * 네트워크 요청 가로채기
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 같은 출처의 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }
  
  // GET 요청만 캐시 처리
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 캐시에 있으면 캐시된 응답 반환
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(request)
          .then((networkResponse) => {
            // 네트워크 응답이 유효한지 확인
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 동적 파일인지 확인하고 캐시에 저장
            if (shouldCache(request.url)) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[SW] Cached dynamic file:', request.url);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Network request failed:', request.url, error);
            
            // 오프라인 페이지나 기본 응답 반환
            if (request.url.endsWith('.html') || 
                request.url === location.origin + '/' || 
                request.url === location.origin + '/sudoku/' ||
                request.url.endsWith('/sudoku') ||
                request.url.endsWith('/sudoku/')) {
              return caches.match('/sudoku/index.html');
            }
            
            // 이미지나 기타 리소스의 경우 기본 응답
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

/**
 * 파일이 캐시되어야 하는지 확인
 */
function shouldCache(url) {
  return DYNAMIC_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 백그라운드 동기화 (선택사항)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * 백그라운드 동기화 작업
 */
async function doBackgroundSync() {
  try {
    // 게임 데이터 동기화 등 백그라운드 작업
    console.log('[SW] Performing background sync...');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * 푸시 알림 처리 (선택사항)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '새로운 알림이 있습니다.',
      icon: './icons/icon-192x192.svg',
      badge: './icons/icon-72x72.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: '확인',
          icon: '/icons/check.png'
        },
        {
          action: 'close',
          title: '닫기',
          icon: '/icons/close.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '스도쿠', options)
    );
  }
});

/**
 * 알림 클릭 처리
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/sudoku/')
    );
  } else if (event.action === 'close') {
    // 알림만 닫기
    return;
  } else {
    // 기본 동작: 앱 열기
    event.waitUntil(
      clients.openWindow('/sudoku/')
    );
  }
});

/**
 * 메시지 처리 (앱과 Service Worker 간 통신)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});

console.log('[SW] Service Worker loaded successfully');
