import axios from "axios";
import swManager from "./serviceWorkerManager";
import offlineManager from "./offlineManager";
import config from "../config/environment";

// Enhanced axios client with offline support
class OfflineHttpClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.FULL_API_URL,
      timeout: config.API_TIMEOUT,
      withCredentials: true,
    });

    this.setupInterceptors();
    this.offlineQueue = [];

    if (config.DEBUG) {
      console.log("HTTP Client initialized with baseURL:", config.FULL_API_URL);
    }
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add timestamp for cache validation
        config.metadata = { requestTime: Date.now() };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Mark as fresh data and cache user data if it's auth/me
        if (response.data) {
          response.data._fresh = true;
          response.data._timestamp = Date.now();

          // Cache user data from /api/auth/me responses
          if (response.config.url.includes("https://ok-motor-51l3.vercel.app/api/auth/me")) {
            localStorage.setItem("cachedUser", JSON.stringify(response.data));
          }
        }
        return response;
      },
      async (error) => {
        const config = error.config;

        // Handle network errors
        if (!navigator.onLine || error.code === "NETWORK_ERROR") {
          console.log("Network error, checking cache...");

          // For GET requests, try to return cached data
          if (config.method === "get") {
            const cachedData = await this.getCachedResponse(config.url);
            if (cachedData) {
              return {
                data: { ...cachedData, _cached: true, _stale: true },
                status: 200,
                statusText: "OK (Cached)",
                headers: {},
                config,
              };
            }
          }

          // For POST/PUT/DELETE requests, queue for later
          if (["post", "put", "delete", "patch"].includes(config.method)) {
            await this.queueRequest(config);
            throw new Error("Request queued for when online");
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Get cached response from service worker cache
  async getCachedResponse(url) {
    // Special handling for auth/me endpoint - check localStorage first
    if (url.includes("/api/auth/me")) {
      const cachedUser = localStorage.getItem("cachedUser");
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.log("Using cached user data from localStorage");
          return { ...userData, _cached: true, _offline: true };
        } catch (error) {
          console.log("Error parsing cached user data:", error);
          localStorage.removeItem("cachedUser"); // Clean up corrupted data
        }
      }
    }

    // Try service worker cache
    if ("caches" in window) {
      try {
        const cache = await caches.open("ok-motor-api-v1");
        const request = new Request(url);
        const response = await cache.match(request);

        if (response) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.log("Cache access failed:", error);
      }
    }
    return null;
  }

  // Queue request for offline sync
  async queueRequest(config) {
    const queuedRequest = {
      id: Date.now() + Math.random(),
      config,
      timestamp: Date.now(),
    };
    this.offlineQueue.push(queuedRequest);

    // Heuristic: if the URL matches a known domain API that has an offlineManager queue,
    // add the item to that queue instead of the generic httpQueue to avoid duplicate entries.
    try {
      const url = typeof config.url === 'string' ? config.url : (config.url && config.url.url) || '';
      const PATH_TO_QUEUE = {
        '/api/advance-bills': 'advanceBillOfflineQueue',
        '/api/service-bills': 'serviceBillOfflineQueue',
        '/api/sell-letters': 'sellLetterOfflineQueue',
        '/api/buy-letter': 'buyLetterOfflineQueue',
      };

      let matchedQueue = null;
      for (const path in PATH_TO_QUEUE) {
        if (url.includes(path)) {
          matchedQueue = PATH_TO_QUEUE[path];
          break;
        }
      }

      if (matchedQueue) {
        // Add to domain-specific offline queue (store minimal metadata)
        const queueItem = {
          id: queuedRequest.id.toString(),
          type: config.method === 'post' ? 'create' : (config.method === 'put' ? 'update' : (config.method === 'delete' ? 'delete' : 'create')),
          data: config.data || {},
          timestamp: new Date().toISOString(),
        };
        offlineManager.addToQueue(matchedQueue, queueItem);
        console.log('Added offline HTTP request to domain queue', matchedQueue, queueItem.id);
      } else {
        // Fallback: store in generic httpQueue in localStorage for other endpoints
        const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
        storedQueue.push(queuedRequest);
        localStorage.setItem("httpQueue", JSON.stringify(storedQueue));

        // Register with service worker manager
        await swManager.queueOfflineAction("HTTP_REQUEST", config.url, {
          method: config.method,
          headers: config.headers,
          body: config.data,
        });

        console.log("Request queued for offline sync:", queuedRequest);
      }
    } catch (err) {
      console.error('Failed to route queued request to offlineManager, falling back to httpQueue', err);
      const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
      storedQueue.push(queuedRequest);
      localStorage.setItem("httpQueue", JSON.stringify(storedQueue));
    }
  }

  // Process offline queue when back online
  async processOfflineQueue() {
    if (!navigator.onLine) return;

    const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
    const processedIds = [];

    for (const queuedRequest of storedQueue) {
      try {
        await this.client(queuedRequest.config);
        processedIds.push(queuedRequest.id);
        console.log("Offline request processed:", queuedRequest);
      } catch (error) {
        console.error(
          "Failed to process offline request:",
          queuedRequest,
          error
        );
      }
    }

    // Remove processed requests
    const remainingQueue = storedQueue.filter(
      (req) => !processedIds.includes(req.id)
    );
    localStorage.setItem("httpQueue", JSON.stringify(remainingQueue));
  }

  // Standard HTTP methods with offline support
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response;
    } catch (error) {
      if (!navigator.onLine) {
        const cachedData = await this.getCachedResponse(url);
        if (cachedData) {
          return {
            data: { ...cachedData, _cached: true },
            status: 200,
            statusText: "OK (Cached)",
          };
        }
      }
      throw error;
    }
  }

  async post(url, data, config = {}) {
    try {
      return await this.client.post(url, data, config);
    } catch (error) {
      if (!navigator.onLine) {
        await this.queueRequest({
          method: "post",
          url,
          data,
          ...config,
        });
        throw new Error("Request queued for when online");
      }
      throw error;
    }
  }

  async put(url, data, config = {}) {
    try {
      return await this.client.put(url, data, config);
    } catch (error) {
      if (!navigator.onLine) {
        await this.queueRequest({
          method: "put",
          url,
          data,
          ...config,
        });
        throw new Error("Request queued for when online");
      }
      throw error;
    }
  }

  async delete(url, config = {}) {
    try {
      return await this.client.delete(url, config);
    } catch (error) {
      if (!navigator.onLine) {
        await this.queueRequest({
          method: "delete",
          url,
          ...config,
        });
        throw new Error("Request queued for when online");
      }
      throw error;
    }
  }

  // Get offline queue status
  getQueueStatus() {
    const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
    return {
      count: storedQueue.length,
      requests: storedQueue,
    };
  }

  // Clear offline queue
  clearQueue() {
    localStorage.removeItem("httpQueue");
    this.offlineQueue = [];
  }
}

// Create and export instance
const httpClient = new OfflineHttpClient();

// Setup queue processing when online
swManager.addCallback(({ type }) => {
  if (type === "ONLINE") {
    httpClient.processOfflineQueue();
  }
});

export default httpClient;
