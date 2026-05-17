const CACHE_NAME = 'code-red-v1';
const LOCAL_FILES = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/src/state.js',
  '/src/main.js',
  '/src/data/diseases.js',
  '/src/data/patients.js',
  '/src/data/staff.js',
  '/src/data/stages.js',
  '/src/systems/ambulance.js',
  '/src/systems/disposition.js',
  '/src/systems/orders.js',
  '/src/systems/scoring.js',
  '/src/systems/triage.js',
  '/src/systems/tutorial.js',
  '/src/systems/vitals.js',
  '/src/ui/dragDrop.js',
  '/src/ui/modals.js',
  '/src/ui/notifications.js',
  '/src/ui/render.js',
  '/src/ui/tutorialSpotlight.js',
  '/src/utils/random.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // CDN（外部ドメイン）はネットワーク優先・失敗時は空レスポンス
  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  // ローカルファイルはキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
