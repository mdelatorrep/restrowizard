const STATIC_CACHE = "restrowizard-static-v3";
const DYNAMIC_CACHE = "restrowizard-dynamic-v3";

// Keep precache minimal to avoid serving stale JS chunks
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/robots.txt",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,500&display=swap",
];

// URLs that should always be fetched from network
const NETWORK_FIRST = [
  "/api/",
  "/functions/v1/",
];

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("📦 Precaching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  event.respondWith(handleFetch(request, url));
});

async function handleFetch(request, url) {
  // Always go network-first for document navigations (avoid stale HTML + mixed chunks)
  if (request.mode === "navigate") {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put("/", networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cached = await caches.match("/");
      return (
        cached ||
        new Response(
          "<!DOCTYPE html><html><head><title>RestroWizard - Sin conexión</title></head><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>",
          { headers: { "Content-Type": "text/html" } }
        )
      );
    }
  }

  // Network-first for APIs
  if (NETWORK_FIRST.some((pattern) => url.href.includes(pattern))) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cachedResponse = await caches.match(request);
      return (
        cachedResponse ||
        new Response(
          JSON.stringify({
            error: "Conexión perdida. Algunos datos pueden no estar actualizados.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }
  }

  // IMPORTANT: avoid caching Vite dev deps / JS/CSS chunks with cache-first.
  // Mixed cached chunks can lead to React hook dispatcher = null.
  const isViteDeps = url.pathname.includes("/node_modules/.vite/");
  const isScriptOrStyle =
    request.destination === "script" ||
    request.destination === "style" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");

  if (isViteDeps || isScriptOrStyle) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error("Network failed for script/style");
    }
  }

  // Cache-first for other assets (images, fonts, etc.)
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Push notification event
self.addEventListener('push', event => {
  console.log('🔔 Push notification received:', event);
  
  let notificationData = {
    title: 'RestroWizard',
    body: 'Tienes una nueva actualización',
    icon: '/assets/restrowizard-logo.png',
    badge: '/assets/restrowizard-logo.png',
    tag: 'restrowizard-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir Dashboard',
        icon: '/assets/restrowizard-logo.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.action === 'open' ? '/dashboard' : '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if RestroWizard is already open
        for (const client of clientList) {
          if (client.url.includes('restrowizard') || client.url.includes('localhost')) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// Background sync (for future offline functionality)
self.addEventListener('sync', event => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Placeholder for syncing offline data when connection returns
  console.log('📡 Syncing offline data...');
}