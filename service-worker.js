const CACHE_NAME = 'loykrathong-v2';
const URLS = [
  './','index.html','manifest.json',
  'images/bg5.png','images/bg5mb.png',
  'images/kt1.png','images/kt2.png','images/kt3.png','images/kt4.png','images/kt5.png',
  'images/tuktuk.png','images/logo.png',
  'images/icon-192.png','images/icon-512.png',
  'audio/song.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(URLS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(fr =>
        caches.open(CACHE_NAME).then(c => { c.put(e.request, fr.clone()); return fr; })
      )
    ).catch(() => caches.match('images/bg5.png'))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});