// src/services/offlineStorage.js
/**
 * Offline Storage Service
 * Manages local JSON storage for offline data with MongoDB schema compatibility
 */

class OfflineStorage {
  constructor() {
    this.collections = {
      buyLetters: 'buyLetters',
      sellLetters: 'sellLetters',
      serviceBills: 'serviceBills',
      advanceBills: 'advanceBills',
      users: 'users'
    };
  }

  /**
   * Check if running in Electron environment
   */
  isElectron() {
    return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron;
  }

  /**
   * Generate a unique ID compatible with MongoDB ObjectId (24 hex characters)
   */
  generateId() {
    // MongoDB ObjectId is 24 hex characters
    // 4 bytes timestamp + 5 bytes random + 3 bytes counter = 12 bytes = 24 hex chars
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomPart1 = Math.random().toString(16).substr(2, 10).padEnd(10, '0');
    const randomPart2 = Math.random().toString(16).substr(2, 6).padEnd(6, '0');
    
    const id = (timestamp + randomPart1 + randomPart2).substr(0, 24);
    console.log('Generated ID:', id, 'Length:', id.length);
    return id;
  }

  /**
   * Read data from a collection
   */
  async read(collection) {
    if (!this.isElectron()) {
      // Fallback to localStorage for browser
      const data = localStorage.getItem(collection);
      return data ? JSON.parse(data) : [];
    }

    try {
      const result = await window.electronAPI.readJsonFile(collection);
      if (result.success) {
        return result.data || [];
      }
      console.error('Error reading JSON file:', result.error);
      return [];
    } catch (error) {
      console.error('Error in read:', error);
      return [];
    }
  }

  /**
   * Write data to a collection
   */
  async write(collection, data) {
    if (!this.isElectron()) {
      // Fallback to localStorage for browser
      localStorage.setItem(collection, JSON.stringify(data));
      return { success: true };
    }

    try {
      const result = await window.electronAPI.writeJsonFile(collection, data);
      return result;
    } catch (error) {
      console.error('Error in write:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new document in a collection
   */
  async create(collection, document) {
    try {
      const data = await this.read(collection);
      
      // Add metadata
      const newDocument = {
        ...document,
        _id: document._id || this.generateId(),
        synced: false,
        createdAt: document.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        localOnly: true
      };

      data.push(newDocument);
      await this.write(collection, data);
      
      return { success: true, data: newDocument };
    } catch (error) {
      console.error('Error creating document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find documents in a collection
   */
  async find(collection, query = {}) {
    try {
      const data = await this.read(collection);
      
      // Simple query matching (extend as needed)
      if (Object.keys(query).length === 0) {
        return { success: true, data };
      }

      const filtered = data.filter(doc => {
        return Object.keys(query).every(key => {
          if (key === '_id') {
            return doc._id === query[key];
          }
          return doc[key] === query[key];
        });
      });

      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error finding documents:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Find a single document by ID
   */
  async findById(collection, id) {
    try {
      const data = await this.read(collection);
      const document = data.find(doc => doc._id === id);
      
      return { 
        success: true, 
        data: document || null 
      };
    } catch (error) {
      console.error('Error finding document by ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Update a document by ID
   */
  async updateById(collection, id, updates) {
    try {
      const data = await this.read(collection);
      const index = data.findIndex(doc => doc._id === id);

      if (index === -1) {
        return { success: false, error: 'Document not found' };
      }

      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false
      };

      await this.write(collection, data);
      
      return { success: true, data: data[index] };
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a document by ID
   */
  async deleteById(collection, id) {
    try {
      const data = await this.read(collection);
      const filtered = data.filter(doc => doc._id !== id);

      if (filtered.length === data.length) {
        return { success: false, error: 'Document not found' };
      }

      await this.write(collection, filtered);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all unsynced documents from a collection
   */
  async getUnsyncedDocuments(collection) {
    try {
      const data = await this.read(collection);
     
      const unsynced = data.filter(doc => doc.synced === false);
     
      return { success: true, data: unsynced };
    } catch (error) {
      console.error('Error getting unsynced documents:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Mark documents as synced
   */
  async markAsSynced(collection, ids) {
    try {
      const data = await this.read(collection);
      
      data.forEach(doc => {
        if (ids.includes(doc._id)) {
          doc.synced = true;
          doc.localOnly = false;
          doc.syncedAt = new Date().toISOString();
        }
      });

      await this.write(collection, data);
      
      return { success: true };
    } catch (error) {
      console.error('Error marking as synced:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sync statistics for a collection
   */
  async getSyncStats(collection) {
    try {
      const data = await this.read(collection);
      
      return {
        success: true,
        stats: {
          total: data.length,
          synced: data.filter(doc => doc.synced === true).length,
          unsynced: data.filter(doc => doc.synced === false).length
        }
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all data from a collection (use with caution)
   */
  async clearCollection(collection) {
    try {
      await this.write(collection, []);
      return { success: true };
    } catch (error) {
      console.error('Error clearing collection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all collections with their stats
   */
  async getAllStats() {
    try {
      const stats = {};
      
      for (const collectionName of Object.values(this.collections)) {
        const result = await this.getSyncStats(collectionName);
        if (result.success) {
          stats[collectionName] = result.stats;
        }
      }

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting all stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfflineStorage();
