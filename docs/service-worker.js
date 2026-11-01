// offline support: pages and assets are kept so the site opens without a connection.
// Pages are fetched fresh when online (so updates show up) and fall back to the saved copy offline;
// other files are served from the saved copy and refreshed in the background.
const CACHE = 'muslimist-v1';
const CORE = ['/', '/quran/', '/quran/progress/', '/duaa/', '/hadith/', '/names/', '/salah/', '/calendar/', '/ramadan/', '/zakat/', '/times/', '/qibla/', '/dashboard/',
  '/assets/site.css', '/assets/site.js', '/assets/alerts.js', '/assets/praytimes.js', '/assets/times.js', '/assets/quranmeta.js',
  '/assets/duaa/duaa.css', '/assets/duaa/duaa.js', '/assets/duaa/arabic.js', '/hadith/data.json', '/quran/fonts/me_quran.ttf', '/manifest.webmanifest', '/assets/icons/favicon-196.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  // only this site's GET requests; audio is streamed (range requests) and left to the network
  if (r.method !== 'GET' || url.origin !== location.origin || r.headers.has('range') || /\.(mp3|m4a|ogg)$/.test(url.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(url.pathname, copy)); return res })
      .catch(async () => (await caches.match(url.pathname)) || (await caches.match(url.pathname.replace(/[^/]*$/, ''))) || caches.match('/')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)) } return res });
    return hit ? (net.catch(() => {}), hit) : net;
  }));
});
// tapping a prayer notification opens the site
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => list[0] ? list[0].focus() : self.clients.openWindow('/times/')));
});
