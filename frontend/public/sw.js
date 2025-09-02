const STATIC_CACHE = "ok-motor-static-v1";
const API_CACHE = "ok-motor-api-v1";
const STATIC_ASSETS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];
this.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
  .then(() => this.skipWaiting())
  );
});
this.addEventListener("activate", (event) => {
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
            return null;
          })
        );
      })
  .then(() => this.clients.claim())
      .then(() => {
        return this.clients.matchAll().then((clientList) => {
          clientList.forEach((client) => {
            try {
              client.postMessage({ type: "SW_UPDATED" });
            } catch (err) {
              console.log("Failed to post message to client:", err);
            }
          });
        });
      })
  );
});
this.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    url.pathname.includes("/download") ||
    url.pathname.includes("/pdf") ||
    request.headers.get("Accept")?.includes("application/pdf") ||
    request.url.includes("responseType=blob")
  ) {
    return;
  }
  const isApiRequest =
    url.pathname.startsWith("/api/") ||
    url.origin === "https://ok-motor-51l3.vercel.app" ||
    (url.origin === "https://ok-motor-51l3.vercel.app" &&
      url.pathname.startsWith("/api/"));

  if (isApiRequest) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  if (
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

// Network-first strategy for navigation requests to avoid serving stale index.html
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const networkResponse = await fetch(request);
    // If network returns ok, optionally update cache for offline use
    if (networkResponse && networkResponse.ok) {
      // Cache the navigation response under '/' so fallback works offline
      try {
        const clone = networkResponse.clone();
        await cache.put("/", clone);
      } catch (err) {
      }
      return networkResponse;
    }
    throw new Error("Network response not ok");
  } catch (error) {
    const cached =
      (await cache.match("/")) || (await cache.match("/index.html"));
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const url = new URL(request.url);

  console.log(
    `Service Worker handling ${request.method} request to: ${url.pathname}`
  );
  if (
    url.pathname.includes("/download") ||
    url.pathname.includes("/pdf") ||
    request.headers.get("Accept")?.includes("application/pdf")
  ) {
    console.log("PDF endpoint detected, passing through to network");
    return fetch(request);
  }
  if (
    url.pathname.includes("/api/service-bills") ||
    url.pathname.includes("/api/advance-bills") ||
    url.pathname.includes("/api/buy-letter") ||
    url.pathname.includes("/api/sell-letters")
  ) {
    console.log("Critical API endpoint detected:", url.pathname);
    console.log("Request method:", request.method);
    try {
      console.log("Making network request to critical endpoint...");
      const response = await fetch(request);
      console.log("Critical endpoint response status:", response.status);
      if (response.ok && request.method === "GET") {
        console.log("Caching successful GET response for critical endpoint");
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      }
      return response;
    } catch (error) {
      console.log("Critical API endpoint failed:", error.message);
      console.log("Letting error propagate to app");
      throw error; 
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      if (request.method === "GET") {
        const responseClone = networkResponse.clone();
        if (url.pathname.includes("/api/auth/me")) {
          try {
            const userData = await networkResponse.clone().json();
            this.clients.matchAll().then((clientList) => {
              clientList.forEach((client) => {
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
      }
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
    if (url.pathname.includes("/api/auth/me")) {
      this.clients.matchAll().then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: "CHECK_CACHED_AUTH",
          });
        });
      });
    }
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      const isStale = data._cached && Date.now() - data._cached > 5 * 60 * 1000;

      if (isStale) {
        data._stale = true;
      }

      return new Response(JSON.stringify(data), {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: cachedResponse.headers,
      });
    }
    console.log("No cached data available, letting request fail naturally");

    // For critical API endpoints, don't interfere - let them fail naturally
    if (
      url.pathname.includes("/api/service-bills") ||
      url.pathname.includes("/api/advance-bills") ||
      url.pathname.includes("/api/buy-letter") ||
      url.pathname.includes("/api/sell-letters")
    ) {
      console.log("Critical API endpoint, letting request fail naturally");
      throw new Error("No cached data available for critical endpoint");
    }

    // For non-critical endpoints, return a more helpful offline response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "No network connection and no cached data available",
        cached: false,
      }),
      {
        status: 200, // Use 200 instead of 503 to avoid confusion
        statusText: "OK",
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
this.addEventListener("sync", (event) => {
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
        this.clients.matchAll().then((clientList) => {
          clientList.forEach((client) => {
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
this.addEventListener("push", (event) => {
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
    this.registration.showNotification("OK Motor Update", options)
    );
  }
});

// Handle notification clicks
this.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(this.clients.openWindow("/"));
});
