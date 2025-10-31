const CACHE_NAME = 'loykrathong-v3';   // bump cache
const URLS = [
  './','index.html','manifest.json',
  'images/bg5.png','images/bg5mb.png',
  'images/kt1.png','images/kt2.png','images/kt3.png','images/kt4.png','images/kt5.png',
  'images/tuktuk.png','images/logo.png',
  'images/icon-192.png','images/icon-512.png'
  // ไม่ cache song.mp3 เพื่อลดปัญหา Range/416
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // ถ้าเป็น Range request (เช่น audio/video) → อย่าแตะ cache
  if (req.headers && req.headers.get('range')) {
    e.respondWith(fetch(req));  // network only
    return;
  }

  // อย่า cache ไฟล์เสียง
  if (req.url.includes('/audio/')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // cache-first + update async
  e.respondWith(
    caches.match(req).then(hit => {
      const fetchPromise = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => hit || caches.match('images/bg5.png'));
      return hit || fetchPromise;
    })
  );
});
