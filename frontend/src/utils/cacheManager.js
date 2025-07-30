// Cache management utilities
class CacheManager {
  constructor() {
    this.CACHE_NAMES = {
      STATIC: "ok-motor-static-v1",
      API: "ok-motor-api-v1",
      IMAGES: "ok-motor-images-v1",
    };
  }

  // Get cache size information
  async getCacheInfo() {
    if (!("caches" in window)) {
      return { supported: false };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = {};
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let cacheSize = 0;

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            cacheSize += blob.size;
          }
        }

        cacheInfo[cacheName] = {
          entries: keys.length,
          size: cacheSize,
          sizeFormatted: this.formatBytes(cacheSize),
        };
        totalSize += cacheSize;
      }

      return {
        supported: true,
        caches: cacheInfo,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        totalCaches: cacheNames.length,
      };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return { supported: true, error: error.message };
    }
  }

  // Clear specific cache
  async clearCache(cacheName) {
    if (!("caches" in window)) {
      throw new Error("Cache API not supported");
    }

    try {
      const deleted = await caches.delete(cacheName);
      return { success: deleted, cacheName };
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  // Clear all caches
  async clearAllCaches() {
    if (!("caches" in window)) {
      throw new Error("Cache API not supported");
    }

    try {
      const cacheNames = await caches.keys();
      const results = await Promise.allSettled(
        cacheNames.map((name) => caches.delete(name))
      );

      return {
        cleared: results.filter((r) => r.status === "fulfilled" && r.value)
          .length,
        total: cacheNames.length,
        results,
      };
    } catch (error) {
      console.error("Error clearing all caches:", error);
      throw error;
    }
  }

  // Preload critical resources
  async preloadCriticalResources() {
    if (!("caches" in window)) {
      return { success: false, reason: "Cache API not supported" };
    }

    const criticalResources = [
      "/",
      "/static/css/main.css",
      "/static/js/bundle.js",
      "/manifest.json",
    ];

    try {
      const cache = await caches.open(this.CACHE_NAMES.STATIC);
      const preloadPromises = criticalResources.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
            return { url, success: true };
          }
          return { url, success: false, reason: "Response not ok" };
        } catch (error) {
          return { url, success: false, reason: error.message };
        }
      });

      const results = await Promise.all(preloadPromises);
      const successful = results.filter((r) => r.success).length;

      return {
        success: successful > 0,
        total: criticalResources.length,
        successful,
        results,
      };
    } catch (error) {
      console.error("Error preloading resources:", error);
      return { success: false, reason: error.message };
    }
  }

  // Cache API response manually
  async cacheApiResponse(url, data, maxAge = 5 * 60 * 1000) {
    // 5 minutes default
    if (!("caches" in window)) {
      return false;
    }

    try {
      const cache = await caches.open(this.CACHE_NAMES.API);
      const response = new Response(
        JSON.stringify({
          ...data,
          _cached: Date.now(),
          _maxAge: maxAge,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `max-age=${maxAge / 1000}`,
          },
        }
      );

      await cache.put(url, response);
      return true;
    } catch (error) {
      console.error("Error caching API response:", error);
      return false;
    }
  }

  // Get cached API response
  async getCachedApiResponse(url) {
    if (!("caches" in window)) {
      return null;
    }

    try {
      const cache = await caches.open(this.CACHE_NAMES.API);
      const response = await cache.match(url);

      if (response) {
        const data = await response.json();

        // Check if cache is expired
        if (data._cached && data._maxAge) {
          const age = Date.now() - data._cached;
          if (age > data._maxAge) {
            // Cache expired, remove it
            await cache.delete(url);
            return null;
          }
        }

        return data;
      }
    } catch (error) {
      console.error("Error getting cached API response:", error);
    }

    return null;
  }

  // Cleanup expired cache entries
  async cleanupExpiredCache() {
    if (!("caches" in window)) {
      return { success: false, reason: "Cache API not supported" };
    }

    try {
      const cache = await caches.open(this.CACHE_NAMES.API);
      const keys = await cache.keys();
      let cleaned = 0;

      for (const request of keys) {
        try {
          const response = await cache.match(request);
          if (response) {
            const data = await response.json();

            if (data._cached && data._maxAge) {
              const age = Date.now() - data._cached;
              if (age > data._maxAge) {
                await cache.delete(request);
                cleaned++;
              }
            }
          }
        } catch (error) {
          // If we can't parse the response, it might be corrupted
          await cache.delete(request);
          cleaned++;
        }
      }

      return { success: true, cleaned, total: keys.length };
    } catch (error) {
      console.error("Error cleaning up expired cache:", error);
      return { success: false, reason: error.message };
    }
  }

  // Format bytes to human readable format
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Get storage quota information
  async getStorageQuota() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          supported: true,
          quota: estimate.quota,
          usage: estimate.usage,
          quotaFormatted: this.formatBytes(estimate.quota || 0),
          usageFormatted: this.formatBytes(estimate.usage || 0),
          usagePercentage: estimate.quota
            ? Math.round((estimate.usage / estimate.quota) * 100)
            : 0,
        };
      } catch (error) {
        return { supported: true, error: error.message };
      }
    }
    return { supported: false };
  }
}

// Create and export singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
