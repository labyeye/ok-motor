const CACHE_NAME = "ok-motor-v1";
const STATIC_CACHE = "ok-motor-static-v1";
const API_CACHE = "ok-motor-api-v1";

// Detect environment
const isProduction =
  self.location.hostname !== "localhost" &&
  self.location.hostname !== "127.0.0.1";
const API_BASE_URL = isProduction
  ? "https://ok-motor.onrender.com/api"
  : "http://localhost:2500/api";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

// API endpoints to cache (relative paths)
const API_ENDPOINTS = [
  "/auth/me",
  "/dashboard",
  "/buy-letters",
  "/sell-letters",
  "/service-bills",
  "/advance-bills",
  "/users",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement cache-first strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - check for both production and development
  const isApiRequest =
    url.pathname.startsWith("/api/") ||
    url.origin === "https://ok-motor.onrender.com" ||
    (url.origin === "http://localhost:2500" &&
      url.pathname.startsWith("/api/"));

  if (isApiRequest) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (
    request.destination === "document" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image"
  ) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const url = new URL(request.url);

  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone();

      // For auth/me endpoint, also store in localStorage for offline access
      if (url.pathname.includes("/api/auth/me")) {
        try {
          const userData = await networkResponse.clone().json();
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "CACHE_AUTH_DATA",
                userData: userData,
              });
            });
          });
        } catch (error) {
          console.log("Failed to cache auth data:", error);
        }
      }

      await cache.put(request, responseClone);

      // Add timestamp for cache validation
      const response = networkResponse.clone();
      const data = await response.json();
      data._cached = Date.now();

      return new Response(JSON.stringify(data), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: networkResponse.headers,
      });
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.log("Network failed, trying cache for:", request.url);

    // For auth/me endpoint, check if we should allow cached access
    if (url.pathname.includes("/api/auth/me")) {
      // Send message to check localStorage for cached user
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "CHECK_CACHED_AUTH",
          });
        });
      });
    }

    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const data = await cachedResponse.json();

      // Check if cache is stale (older than 5 minutes)
      const isStale = data._cached && Date.now() - data._cached > 5 * 60 * 1000;

      if (isStale) {
        // Mark as stale data
        data._stale = true;
      }

      return new Response(JSON.stringify(data), {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: cachedResponse.headers,
      });
    }

    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "No network connection and no cached data available",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response for future use
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log("Failed to fetch static asset:", request.url);
  }

  // Fallback for navigation requests
  if (request.mode === "navigate") {
    const fallback = await cache.match("/");
    return fallback || new Response("Offline", { status: 503 });
  }

  return new Response("Asset not available offline", { status: 503 });
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(processOfflineActions());
  }
});

// Process actions that were queued while offline
async function processOfflineActions() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        // Remove successful action from queue
        await removeOfflineAction(action.id);

        // Notify clients of successful sync
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_SUCCESS",
              action: action.type,
            });
          });
        });
      } catch (error) {
        console.log("Failed to sync action:", action, error);
      }
    }
  } catch (error) {
    console.log("Background sync failed:", error);
  }
}

// Helper functions for offline action queue
async function getOfflineActions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineAction(id) {
  // Remove action from IndexedDB
  console.log("Removing offline action:", id);
}

// Handle push notifications (optional)
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: "/logo192.png",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
    };

    event.waitUntil(
      self.registration.showNotification("OK Motor Update", options)
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
