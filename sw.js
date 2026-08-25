/* BauW PWA Service Worker — 离线缓存 + 运行时缓存 */
const CACHE = 'bauw-v19';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './dict.js',
  './words.js',
  './jszip.min.js',
  './epub.min.js',
  './fonts.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});


self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){ if('focus' in cs[i]) return cs[i].focus(); }
    if(clients.openWindow) return clients.openWindow('./');
  }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 同源：缓存优先，回退网络并把结果写入缓存
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
          }
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  } else {
    // 跨域（CDN 字体/库）：网络优先，失败回退缓存
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
