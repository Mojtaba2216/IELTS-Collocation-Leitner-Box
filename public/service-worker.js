const CACHE_NAME = 'ielts-collocation-leitner-box-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/FlashCard.tsx',
  '/src/components/Dashboard.tsx',
  '/src/components/LeitnerBox.tsx',
  '/src/components/Categories.tsx',
  '/src/components/ProgressChart.tsx',
  '/src/utils/leitnerAlgorithm.ts',
  '/src/utils/storage.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
