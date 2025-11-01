const CACHE_NAME = 'loykrathong-v3';
const URLS = [
  './','index.html','manifest.json',
  'images/bg5.png','images/bg5mb.png',
  'images/kt1.png','images/kt2.png','images/kt3.png','images/kt4.png','images/kt5.png',
  'images/tuktuk.png','images/logo.png',
  'images/icon-192.png','images/icon-512.png'
];

// แคชเฉพาะรูป/หน้า ไม่แคชเสียง (กัน 416)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(URLS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))) .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req=e.request;
  if (req.headers && req.headers.get('range')) { e.respondWith(fetch(req)); return; }
  if (req.url.includes('/audio/')) { e.respondWith(fetch(req).catch(()=>caches.match(req))); return; }
  e.respondWith(
    caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{ caches.open(CACHE_NAME).then(c=>c.put(req,res.clone())); return res; })
        .catch(()=>hit || caches.match('images/bg5.png'));
      return hit || net;
    })
  );
});
