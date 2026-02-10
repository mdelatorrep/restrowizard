const STATIC_CACHE = "restrowizard-static-v4";
const DYNAMIC_CACHE = "restrowizard-dynamic-v4";
const OFFLINE_PAGE = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/robots.txt",
  "/offline.html",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,500&display=swap",
];

const NETWORK_FIRST = ["/api/", "/functions/v1/"];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("🔧 SW v4 installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("✅ SW v4 activated");
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith("http")) return;
  event.respondWith(handleFetch(request, new URL(request.url)));
});

async function handleFetch(request, url) {
  // Navigate → network-first with offline fallback
  if (request.mode === "navigate") {
    try {
      const res = await fetch(request);
      if (res.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put("/", res.clone());
      }
      return res;
    } catch {
      const cached = await caches.match("/");
      return cached || caches.match(OFFLINE_PAGE) || new Response("Offline", { status: 503 });
    }
  }

  // API → network-first
  if (NETWORK_FIRST.some((p) => url.href.includes(p))) {
    try {
      const res = await fetch(request);
      if (res.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, res.clone());
      }
      return res;
    } catch {
      return (await caches.match(request)) ||
        new Response(JSON.stringify({ error: "Sin conexión" }), {
          status: 503, headers: { "Content-Type": "application/json" },
        });
    }
  }

  // Scripts/styles → network-first (avoid stale chunk issues)
  const isVite = url.pathname.includes("/node_modules/.vite/");
  const isCodeAsset =
    request.destination === "script" || request.destination === "style" ||
    url.pathname.endsWith(".js") || url.pathname.endsWith(".css");

  if (isVite || isCodeAsset) {
    try {
      const res = await fetch(request);
      if (res.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, res.clone());
      }
      return res;
    } catch {
      return (await caches.match(request)) || new Response("", { status: 503 });
    }
  }

  // Everything else → cache-first
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response("", { status: 503 });
  }
}

// ─── PUSH NOTIFICATIONS ────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "RestroWizard",
    body: "Tienes una nueva actualización",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "restrowizard-notification",
    renotify: true,
    requireInteraction: false,
    vibrate: [100, 50, 100],
    data: { url: "/r/dashboard" },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Descartar" },
    ],
  };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text(); }
  }

  event.waitUntil(self.registration.showNotification(data.title, data));
});

// ─── NOTIFICATION CLICK ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/r/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// ─── BACKGROUND SYNC ───────────────────────────────────────
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync:", event.tag);
  if (event.tag === "sync-offline-data") {
    event.waitUntil(syncOfflineData());
  }
  if (event.tag === "sync-pos-transactions") {
    event.waitUntil(syncPOSTransactions());
  }
});

async function syncOfflineData() {
  console.log("📡 Syncing offline data...");
  // Read from IndexedDB and POST to server
  try {
    const db = await openDB();
    const tx = db.transaction("offline-queue", "readonly");
    const store = tx.objectStore("offline-queue");
    const items = await getAllFromStore(store);
    
    for (const item of items) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.body),
        });
        // Remove from queue on success
        const delTx = db.transaction("offline-queue", "readwrite");
        delTx.objectStore("offline-queue").delete(item.id);
      } catch {
        console.log("⏳ Will retry later:", item.id);
      }
    }
  } catch (e) {
    console.log("Could not sync:", e);
  }
}

async function syncPOSTransactions() {
  console.log("💳 Syncing POS transactions...");
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("restrowizard-offline", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("offline-queue")) {
        db.createObjectStore("offline-queue", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── PERIODIC BACKGROUND SYNC ──────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-alerts") {
    event.waitUntil(checkForAlerts());
  }
  if (event.tag === "update-dashboard") {
    event.waitUntil(updateDashboardCache());
  }
});

async function checkForAlerts() {
  console.log("🔔 Checking for new alerts...");
}

async function updateDashboardCache() {
  console.log("📊 Updating dashboard cache...");
}

// ─── MESSAGE HANDLER (for skip-waiting, cache control) ─────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CACHE_URLS") {
    const urls = event.data.urls || [];
    caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(urls));
  }
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((names) =>
      Promise.all(names.map((n) => caches.delete(n)))
    );
  }
});
