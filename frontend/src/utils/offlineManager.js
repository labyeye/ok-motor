// Offline Manager Utility
import httpClient from './offlineHttpClient';

// Known queue -> API endpoints mapping
const QUEUE_ENDPOINTS = {
  advanceBillOfflineQueue: {
    create: 'https://ok-motor-51l3.vercel.app/api/advance-bills',
    update: 'https://ok-motor-51l3.vercel.app/api/advance-bills',
    delete: 'https://ok-motor-51l3.vercel.app/api/advance-bills',
  },
  serviceBillOfflineQueue: {
    create: 'https://ok-motor-51l3.vercel.app/api/service-bills',
    update: 'https://ok-motor-51l3.vercel.app/api/service-bills',
    delete: 'https://ok-motor-51l3.vercel.app/api/service-bills',
  },
  sellLetterOfflineQueue: {
    create: 'https://ok-motor-51l3.vercel.app/api/sell-letters',
    update: 'https://ok-motor-51l3.vercel.app/api/sell-letters',
    delete: 'https://ok-motor-51l3.vercel.app/api/sell-letters',
  },
  buyLetterOfflineQueue: {
    create: 'https://ok-motor-51l3.vercel.app/api/buy-letter',
    update: 'https://ok-motor-51l3.vercel.app/api/buy-letter',
    delete: 'https://ok-motor-51l3.vercel.app/api/buy-letter',
  },
};

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();

    // Delay sync to avoid initialization issues
    if (this.isOnline) {
      // Use setTimeout to defer execution until after module initialization
      setTimeout(() => {
        this.syncAllQueues();
      }, 100);
    }
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
  // Sync all known queues
  this.syncAllQueues();
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
    // Deduplicate by type + data signature (JSON)
    try {
      // Compute a stable signature ignoring ephemeral fields that can differ between attempts
      const stripEphemeral = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        // Remove common ephemeral fields
        ['timestamp', 'filename', 'id', '_id', 'createdAt', 'updatedAt'].forEach(k => delete copy[k]);
        return copy;
      };
      const newDataSig = JSON.stringify(stripEphemeral(item.data || {}));
      const existing = queue.find(q => q.type === item.type && JSON.stringify(stripEphemeral(q.data || {})) === newDataSig);
      if (existing) {
        // update timestamp and return existing id
        existing.timestamp = new Date().toISOString();
        this.saveToStorage(queueName, queue);
        return existing.id;
      }
    } catch (err) {
      // If stringify fails, fall back to blind push
      console.warn('Failed to compute signature for dedupe', err);
    }

    const queueItem = {
      id: item.id || Date.now().toString(),
      ...item,
      timestamp: new Date().toISOString(),
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

  // Remove items from queue matching a predicate function
  removeFromQueueBy(queueName, predicateFn) {
    const queue = this.getQueue(queueName);
    const filteredQueue = queue.filter(item => !predicateFn(item));
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
    // Attach token if present
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const config = { headers };
        
        switch (item.type) {
          case 'save':
          case 'create':
            // alias 'create' to 'save' for historical reasons
            response = await httpClient.post(endpoints.create, item.data, config);
            break;
          case 'update':
      response = await httpClient.put(`${endpoints.update}/${item.id}`, item.data, config);
            break;
          case 'delete':
      response = await httpClient.delete(`${endpoints.delete}/${item.id}`, config);
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

  // Sync all configured queues
  async syncAllQueues() {
    const queueNames = Object.keys(QUEUE_ENDPOINTS);
    for (const q of queueNames) {
      try {
        const endpoints = QUEUE_ENDPOINTS[q];
        await this.syncOfflineData(httpClient, q, endpoints);
      } catch (err) {
        console.error('Failed to sync queue', q, err);
      }
    }
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
