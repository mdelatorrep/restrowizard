/**
 * RestroWizard Service Worker — v5
 *
 * CRITICAL: never cache the Supabase Data/Auth/Functions/Storage APIs.
 * Caching them caused stale reads (P1-4): created records appeared missing
 * because GETs were served from cache. This SW serves the API network-only
 * and only caches static assets / app shell.
 */
const STATIC_CACHE = "restrowizard-static-v5";
const DYNAMIC_CACHE = "restrowizard-dynamic-v5";
const OFFLINE_PAGE = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/robots.txt",
  "/offline.html",
];

// Any URL matching these patterns must bypass the cache entirely.
const NEVER_CACHE_PATTERNS = [
  "/rest/v1/",
  "/auth/v1/",
  "/functions/v1/",
  "/storage/v1/",
  "/realtime/v1/",
  "supabase.co",
  "supabase.in",
];

function shouldBypassCache(url) {
  const href = url.href || "";
  return NEVER_CACHE_PATTERNS.some((p) => href.includes(p));
}

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("🔧 SW v5 installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("✅ SW v5 activated — purging old caches and stale API responses");
  event.waitUntil(
    (async () => {
      // Drop ALL old caches (including v4 that contained Supabase API responses)
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
          .map((n) => caches.delete(n))
      );

      // Defensive: also evict any Supabase API entries that might have leaked
      // into the new dynamic cache from a previous SW.
      try {
        const dyn = await caches.open(DYNAMIC_CACHE);
        const reqs = await dyn.keys();
        await Promise.all(
          reqs.map((req) => {
            try {
              const u = new URL(req.url);
              if (shouldBypassCache(u)) return dyn.delete(req);
            } catch { /* noop */ }
            return Promise.resolve();
          })
        );
      } catch { /* noop */ }

      await self.clients.claim();
    })()
  );
});

// ─── FETCH ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!request.url.startsWith("http")) return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // ── Never intercept Supabase API: pure network, no cache reads/writes ──
  if (shouldBypassCache(url)) return;

  // Only handle GET for caching beyond this point
  if (request.method !== "GET") return;

  event.respondWith(handleFetch(request, url));
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

  // Scripts/styles → network-first (avoid stale chunks)
  const isCodeAsset =
    request.destination === "script" || request.destination === "style" ||
    url.pathname.endsWith(".js") || url.pathname.endsWith(".css");

  if (isCodeAsset) {
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

  // Everything else (images, fonts) → cache-first
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

// ─── SKIP WAITING (manual update) ───────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
