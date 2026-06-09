const CACHE_NAME = "tezconnect-v1";

// Files to cache for offline shell
const STATIC_ASSETS = [
  "/",
  "/index.html",
];

// Install — cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML pages → network first, fall back to cache
// - Supabase API → network only (never cache auth/data)
// - Static assets (JS, CSS, fonts) → cache first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache Supabase requests
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Never cache chrome-extension or non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // HTML — network first
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "TezConnect", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: { url: data.url || "/" },
    })
  );
});

// Notification click — open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
