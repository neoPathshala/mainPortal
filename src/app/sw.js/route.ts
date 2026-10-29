// Compatibility cleanup for workers installed before PWA support was deferred.
// Keep this endpoint in the browser release so old cached apps can retire safely.
export function GET() {
  return new Response(`
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => /^(neocsit-|neopathshala-)/.test(key)).map(key => caches.delete(key)));
  await self.clients.claim();
  await self.registration.unregister();
})()));
`, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
}
