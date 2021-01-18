// VERSION: 1

var devMode = 1;

if (devMode == 1) {
  caches.keys().then(keys => {
    console.log('devMode enabled');
    return Promise.all(keys
      .map(key => caches.delete(key))
    );
  })
}

const staticCacheName = 'site-static';
const dynamicCacheName = 'site-dynamic';
const assets = [
  '/',
  '/assets/css/app.css',
  '/assets/js/app.js',
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if(keys.length > size){
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install event
self.addEventListener('install', evt => {
  console.log('service worker installed');
  if (devMode == 0) {
    evt.waitUntil(
      caches.open(staticCacheName).then((cache) => {
        console.log('caching shell assets');
        cache.addAll(assets);
      })
    );
  }
});

// activate event
self.addEventListener('activate', evt => {
  console.log('service worker activated');
  evt.waitUntil(
    caches.keys().then(keys => {
      console.log(keys);
      return Promise.all(keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// fetch event
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(dynamicCacheName).then(cache => {
          if (devMode == 0) {
            cache.put(evt.request.url, fetchRes.clone());
          }
          limitCacheSize(dynamicCacheName, 15);
          return fetchRes;
        })
      });
    }).catch(() => {
      if(evt.request.url.indexOf('.html') > -1){
        return caches.match('/offline.html');
      } 
    })
  );
});


// message event
self.addEventListener('message', evt => {
  if (evt.data === 'skipWaiting') {
    skipWaiting();
  }
});

