// Service Worker registration and management
class ServiceWorkerManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = new Set();
    this.setupEventListeners();
  }

  // Register service worker
  async register() {
    if ("serviceWorker" in navigator) {
      try {
        // Use process.env.PUBLIC_URL for correct path in production
        const swPath = process.env.PUBLIC_URL
          ? `${process.env.PUBLIC_URL}/sw.js`
          : "/sw.js";
        const registration = await navigator.serviceWorker.register(swPath);
        console.log("Service Worker registered successfully:", registration);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              this.notifyCallbacks("UPDATE_AVAILABLE");
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
      }
    } else {
      throw new Error("Service Worker not supported");
    }
  }

  // Setup network status listeners
  setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyCallbacks("ONLINE");
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyCallbacks("OFFLINE");
    });
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case "SYNC_SUCCESS":
        this.notifyCallbacks("SYNC_SUCCESS", data.action);
        break;
      case "SW_UPDATED":
        // Notify clients that a new SW has activated and taken control
        this.notifyCallbacks("SW_UPDATED");
        break;
      case "CACHE_UPDATED":
        this.notifyCallbacks("CACHE_UPDATED");
        break;
      case "CACHE_AUTH_DATA":
        // Cache user data in localStorage for offline access
        if (data.userData) {
          localStorage.setItem("cachedUser", JSON.stringify(data.userData));
          console.log("User data cached for offline access");
        }
        break;
      case "CHECK_CACHED_AUTH":
        // This is a request from SW to check if we have cached auth data
        console.log("Service worker checking for cached auth data");
        break;
      default:
        console.log("Unknown service worker message:", data);
    }
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register("background-sync");
        console.log("Background sync registered");
      } catch (error) {
        console.error("Background sync registration failed:", error);
      }
    }
  }

  // Queue action for offline sync
  async queueOfflineAction(actionType, url, options = {}) {
    const action = {
      id: Date.now() + Math.random(),
      type: actionType,
      url,
      options,
      timestamp: Date.now(),
    };

    // Store in localStorage (in a real app, use IndexedDB)
    const offlineActions = JSON.parse(
      localStorage.getItem("offlineActions") || "[]"
    );
    offlineActions.push(action);
    localStorage.setItem("offlineActions", JSON.stringify(offlineActions));

    console.log("Action queued for offline sync:", action);

    // Try to register background sync
    this.syncOfflineData();

    return action;
  }

  // Add callback for network/service worker events
  addCallback(callback) {
    this.callbacks.add(callback);
  }

  // Remove callback
  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  // Notify all callbacks
  notifyCallbacks(type, data = null) {
    this.callbacks.forEach((callback) => {
      try {
        callback({ type, data, isOnline: this.isOnline });
      } catch (error) {
        console.error("Callback error:", error);
      }
    });
  }

  // Get network status
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connection:
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection,
    };
  }

  // Update service worker
  async updateServiceWorker() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  }

  // Clear cache
  async clearCache() {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("All caches cleared");
    }
  }
}

// Create global instance
const swManager = new ServiceWorkerManager();

export default swManager;
