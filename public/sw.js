const CACHE_NAME = 'restrowizard-v1';
const STATIC_CACHE = 'restrowizard-static-v1';
const DYNAMIC_CACHE = 'restrowizard-dynamic-v1';

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/auth',
  '/diagnosis',
  '/dashboard',
  '/menus',
  '/events',
  '/jobs',
  '/src/assets/restrowizard-logo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,500&display=swap'
];

// URLs that should always be fetched from network
const NETWORK_FIRST = [
  '/api/',
  'https://nvlfykimndffywwuirft.supabase.co/',
  '/functions/v1/'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocols
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    handleFetch(request, url)
  );
});

async function handleFetch(request, url) {
  // Network first for API calls
  if (NETWORK_FIRST.some(pattern => url.href.includes(pattern))) {
    try {
      const networkResponse = await fetch(request);
      // Cache successful API responses
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.log('🌐 Network failed, trying cache for:', url.href);
      const cachedResponse = await caches.match(request);
      return cachedResponse || new Response(
        JSON.stringify({ error: 'Conexión perdida. Algunos datos pueden no estar actualizados.' }), 
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Cache first for static assets and pages
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(
        STATIC_ASSETS.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE
      );
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Fetch failed for:', url.href);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      return offlinePage || new Response(
        '<!DOCTYPE html><html><head><title>RestroWizard - Sin conexión</title></head><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
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