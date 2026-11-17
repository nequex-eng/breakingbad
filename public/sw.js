// Retire the legacy offline shell. Current game assets are served directly by Pages.
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  await self.registration.unregister();
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith("abq-stories-")).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
