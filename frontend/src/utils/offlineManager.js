// Offline Manager Utility
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });
  }

  onOnline() {
    console.log('🟢 Back online - syncing data...');
    this.syncOfflineData();
  }

  onOffline() {
    console.log('🔴 Went offline - data will be queued');
  }

  // Save data to localStorage
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Load data from localStorage
  loadFromStorage(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  }

  // Remove data from localStorage
  removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // Add item to offline queue
  addToQueue(queueName, item) {
    const queue = this.loadFromStorage(queueName, []);
    const queueItem = {
      id: item.id || Date.now().toString(),
      ...item,
      timestamp: new Date().toISOString()
    };
    queue.push(queueItem);
    this.saveToStorage(queueName, queue);
    return queueItem.id;
  }

  // Get offline queue
  getQueue(queueName) {
    return this.loadFromStorage(queueName, []);
  }

  // Remove item from queue
  removeFromQueue(queueName, itemId) {
    const queue = this.getQueue(queueName);
    const filteredQueue = queue.filter(item => item.id !== itemId);
    this.saveToStorage(queueName, filteredQueue);
  }

  // Clear entire queue
  clearQueue(queueName) {
    this.saveToStorage(queueName, []);
  }

  // Sync offline data with server
  async syncOfflineData(httpClient, queueName, endpoints) {
    if (!this.isOnline) {
      console.log('Still offline, cannot sync');
      return;
    }

    const queue = this.getQueue(queueName);
    if (queue.length === 0) {
      console.log('No offline data to sync');
      return;
    }

    console.log(`🔄 Syncing ${queue.length} items...`);

    for (const item of queue) {
      try {
        let response;
        
        switch (item.type) {
          case 'save':
            response = await httpClient.post(endpoints.create, item.data);
            break;
          case 'update':
            response = await httpClient.put(`${endpoints.update}/${item.id}`, item.data);
            break;
          case 'delete':
            response = await httpClient.delete(`${endpoints.delete}/${item.id}`);
            break;
          default:
            console.warn('Unknown queue item type:', item.type);
            continue;
        }

        if (response.status >= 200 && response.status < 300) {
          this.removeFromQueue(queueName, item.id);
          console.log(`✅ Synced item ${item.id}`);
        } else {
          console.warn(`⚠️ Failed to sync item ${item.id}:`, response.status);
        }
      } catch (error) {
        console.error(`❌ Error syncing item ${item.id}:`, error);
        // Keep failed items in queue for retry
      }
    }

    console.log('🔄 Sync completed');
  }

  // Check if we're online
  getOnlineStatus() {
    return this.isOnline;
  }

  // Get queue status
  getQueueStatus(queueName) {
    const queue = this.getQueue(queueName);
    return {
      count: queue.length,
      items: queue
    };
  }

  // Clear all offline data
  clearAllOfflineData() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('OfflineQueue') || key.includes('FormData')) {
        this.removeFromStorage(key);
      }
    });
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;
