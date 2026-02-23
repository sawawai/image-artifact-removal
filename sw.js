const CACHE = 'coi-v5';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.type === 'opaque') return resp;

      const newHeaders = new Headers(resp.headers);
      newHeaders.set('Cross-Origin-Opener-Policy',   'same-origin');
      newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
      newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

      return new Response(resp.body, {
        status:     resp.status,
        statusText: resp.statusText,
        headers:    newHeaders,
      });
    })
  );
});
