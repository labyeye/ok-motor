import offlineStorage from "./offlineStorage";
import networkService from "./networkService";
import axios from "axios";

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncListeners = [];
    this.autoSyncEnabled = true;
    this.syncIntervalTime = 60000;
    this.syncInterval = null;

    this.init();
  }

  init() {
    networkService.subscribe((isOnline, wasOnline) => {
      if (isOnline && !wasOnline) {
        console.log("Connection restored, triggering auto-sync");
        if (this.autoSyncEnabled) {
          this.syncAll();
        }
      }
    });

    this.loadSyncMetadata();

    if (this.autoSyncEnabled) {
      this.startAutoSync();
    }
  }

  async loadSyncMetadata() {
    if (window.electronAPI) {
      const lastSync = await window.electronAPI.getAppSetting("lastSyncTime");
      if (lastSync) {
        this.lastSyncTime = new Date(lastSync);
      }
    } else {
      const lastSync = localStorage.getItem("lastSyncTime");
      if (lastSync) {
        this.lastSyncTime = new Date(lastSync);
      }
    }
  }

  async saveSyncMetadata() {
    this.lastSyncTime = new Date();

    if (window.electronAPI) {
      await window.electronAPI.setAppSetting(
        "lastSyncTime",
        this.lastSyncTime.toISOString(),
      );
    } else {
      localStorage.setItem("lastSyncTime", this.lastSyncTime.toISOString());
    }
  }

  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (networkService.getStatus() && !this.isSyncing) {
        this.syncAll();
      }
    }, this.syncIntervalTime);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  setAutoSync(enabled) {
    this.autoSyncEnabled = enabled;

    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  subscribe(callback) {
    this.syncListeners.push(callback);

    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  notifyListeners(event, data) {
    this.syncListeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Error in sync listener:", error);
      }
    });
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return { success: false, message: "Sync already in progress" };
    }

    if (!networkService.getStatus()) {
      console.log("Cannot sync: offline");
      return { success: false, message: "Cannot sync while offline" };
    }

    this.isSyncing = true;
    this.notifyListeners("sync-start", {});

    const results = {
      buyLetters: null,
      sellLetters: null,
      serviceBills: null,
      advanceBills: null,
    };

    try {
      for (const collection of Object.keys(results)) {
        try {
          const result = await this.syncCollection(collection);
          results[collection] = result;
        } catch (error) {
          console.error(`Error syncing ${collection}:`, error);
          results[collection] = { success: false, error: error.message };
        }
      }

      await this.saveSyncMetadata();

      this.notifyListeners("sync-complete", { results });

      return { success: true, results };
    } catch (error) {
      console.error("Error in syncAll:", error);
      this.notifyListeners("sync-error", { error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  async syncCollection(collection) {
    try {
      console.log(`🔄 Starting sync for collection: ${collection}`);

      const unsyncedResult =
        await offlineStorage.getUnsyncedDocuments(collection);

      if (!unsyncedResult.success) {
        console.error(
          `❌ Failed to get unsynced documents for ${collection}:`,
          unsyncedResult.error,
        );
        throw new Error(unsyncedResult.error);
      }

      const unsyncedDocs = unsyncedResult.data;
      console.log(
        `📦 Found ${unsyncedDocs.length} unsynced documents in ${collection}:`,
        unsyncedDocs,
      );

      if (unsyncedDocs.length === 0) {
        console.log(`✅ No documents to sync for ${collection}`);
        return { success: true, synced: 0, message: "No documents to sync" };
      }

      console.log(
        `📤 Syncing ${unsyncedDocs.length} documents from ${collection} to server...`,
      );

      const response = await axios.post(`/api/sync/${collection}`, {
        documents: unsyncedDocs,
      });

      console.log(`📥 Server response for ${collection}:`, response.data);

      if (response.data.success) {
        const syncedIds =
          response.data.syncedIds || unsyncedDocs.map((doc) => doc._id);
        console.log(
          `✅ Marking ${syncedIds.length} documents as synced in ${collection}`,
        );
        await offlineStorage.markAsSynced(collection, syncedIds);

        return {
          success: true,
          synced: syncedIds.length,
          message: `Synced ${syncedIds.length} documents`,
        };
      } else {
        console.error(
          `❌ Sync failed for ${collection}:`,
          response.data.message,
        );
        throw new Error(response.data.message || "Sync failed");
      }
    } catch (error) {
      console.error(`❌ Error syncing collection ${collection}:`, error);

      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
        return {
          success: false,
          error: "Network error - will retry later",
          retryable: true,
        };
      }

      return {
        success: false,
        error: error.message,
        retryable: false,
      };
    }
  }

  async forceSyncNow() {
    const isOnline = await networkService.forceCheck();

    if (!isOnline) {
      throw new Error("Cannot sync: No internet connection");
    }

    return await this.syncAll();
  }

  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      autoSyncEnabled: this.autoSyncEnabled,
      isOnline: networkService.getStatus(),
    };
  }

  async getSyncStatistics() {
    try {
      const stats = await offlineStorage.getAllStats();

      return {
        success: true,
        collections: stats.stats,
        lastSyncTime: this.lastSyncTime,
        isSyncing: this.isSyncing,
      };
    } catch (error) {
      console.error("Error getting sync statistics:", error);
      return { success: false, error: error.message };
    }
  }

  clearSyncQueue() {
    this.syncQueue = [];
  }

  destroy() {
    this.stopAutoSync();
    this.syncListeners = [];
  }
}

const syncServiceInstance = new SyncService();
export default syncServiceInstance;
