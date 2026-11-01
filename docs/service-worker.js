// The old site registered a service worker. This version removes it from any browser that still has it.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.registration.unregister());
