// Enhanced offline sync manager for form submissions
class OfflineSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    this.setupEventListeners();
    this.loadQueueFromStorage();
  }

  setupEventListeners() {
    window.addEventListener("online", async () => {
      this.isOnline = true;
      console.log("🌐 Back online! Processing sync queue...");
      await this.processSyncQueue();
      this.notifyCallbacks("ONLINE");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("📡 Gone offline! Forms will be queued for sync.");
      this.notifyCallbacks("OFFLINE");
    });
  }

  // Queue form for offline sync
  queueFormSubmission(formType, formData, options = {}) {
    const queueItem = {
      id: this.generateId(),
      type: formType,
      data: formData,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      status: "queued",
      userMessage: this.getQueueMessage(formType),
    };

    this.syncQueue.push(queueItem);
    this.saveQueueToStorage();

    console.log(`📝 Queued ${formType} for sync:`, queueItem);

    // Notify UI components
    this.notifyCallbacks("FORM_QUEUED", {
      type: formType,
      message: queueItem.userMessage,
      queueId: queueItem.id,
    });

    return {
      success: true,
      queued: true,
      queueId: queueItem.id,
      message: queueItem.userMessage,
    };
  }

  getQueueMessage(formType) {
    const messages = {
      "service-bill": "Service bill saved locally. Will sync when online.",
      "buy-letter": "Buy letter saved locally. Will sync when online.",
      "sell-letter": "Sell letter saved locally. Will sync when online.",
      "advance-bill": "Advance bill saved locally. Will sync when online.",
      "staff-member": "Staff member saved locally. Will sync when online.",
    };
    return messages[formType] || "Form saved locally. Will sync when online.";
  }

  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`🔄 Processing ${this.syncQueue.length} queued items...`);

    const queueCopy = [...this.syncQueue];

    for (const item of queueCopy) {
      try {
        item.status = "syncing";
        this.notifyCallbacks("SYNC_STARTED", { item });

        const result = await this.syncItem(item);

        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter((q) => q.id !== item.id);

        console.log(`✅ Successfully synced ${item.type}:`, result);

        this.notifyCallbacks("SYNC_SUCCESS", {
          type: item.type,
          data: result,
          originalItem: item,
          message: `${this.getSuccessMessage(item.type)} synced successfully!`,
        });
      } catch (error) {
        console.error(`❌ Failed to sync ${item.type}:`, error);

        item.retryCount = (item.retryCount || 0) + 1;
        item.status = "failed";
        item.lastError = error.message;

        if (item.retryCount >= 3) {
          // Remove after max retries
          this.syncQueue = this.syncQueue.filter((q) => q.id !== item.id);

          this.notifyCallbacks("SYNC_FAILED", {
            type: item.type,
            error: error.message,
            originalItem: item,
            message: `Failed to sync ${this.getSuccessMessage(
              item.type
            )} after 3 attempts.`,
          });
        } else {
          item.status = "retry";
          console.log(
            `🔁 Will retry ${item.type} (attempt ${item.retryCount}/3)`
          );
        }
      }
    }

    this.saveQueueToStorage();
  }

  getSuccessMessage(formType) {
    const messages = {
      "service-bill": "Service bill",
      "buy-letter": "Buy letter",
      "sell-letter": "Sell letter",
      "advance-bill": "Advance bill",
      "staff-member": "Staff member",
    };
    return messages[formType] || "Form";
  }

  async syncItem(item) {
    const { type, data, options } = item;

    // Import httpClient dynamically to avoid circular dependency
    const { default: httpClient } = await import("./offlineHttpClient");

    let response;

    switch (type) {
      case "service-bill":
        response = await httpClient.post("/api/service-bills", data);
        break;
      case "buy-letter":
        response = await httpClient.post("/api/buy-letters", data);
        break;
      case "sell-letter":
        response = await httpClient.post("/api/sell-letters", data);
        break;
      case "advance-bill":
        response = await httpClient.post("/api/advance-bills", data);
        break;
      case "staff-member":
        response = await httpClient.post("/api/users", data);
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }

    return response.data;
  }

  saveQueueToStorage() {
    localStorage.setItem("offlineSyncQueue", JSON.stringify(this.syncQueue));
  }

  loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem("offlineSyncQueue");
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error("Error loading sync queue:", error);
      this.syncQueue = [];
    }
  }

  // Add callback for sync events
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks(event, data = {}) {
    this.callbacks.forEach((callback) => {
      try {
        callback({ event, data, isOnline: this.isOnline });
      } catch (error) {
        console.error("Callback error:", error);
      }
    });
  }

  // Get queue status
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      items: this.syncQueue.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        timestamp: item.timestamp,
        retryCount: item.retryCount,
        userMessage: item.userMessage,
      })),
    };
  }

  // Clear queue (for testing)
  clearQueue() {
    this.syncQueue = [];
    localStorage.removeItem("offlineSyncQueue");
  }

  // Manual sync trigger
  async triggerSync() {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }
}

// Create singleton instance
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;
