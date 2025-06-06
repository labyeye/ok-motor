class OfflineManager {
  constructor() {
    this.STORE_NAME = 'pendingSubmissions';
    this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OkMotorDB', 1);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'localId' });
        }
      };
    });
  }

  async savePendingSubmission(type, data) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const submission = {
        localId: Date.now(),
        type,
        data,
        createdAt: new Date().toISOString(),
        synced: false
      };

      const request = store.add(submission);

      request.onsuccess = () => resolve(submission);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getPendingSubmissions() {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async markAsSynced(localId) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const getRequest = store.get(localId);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (event) => reject(event.target.error);
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = (event) => reject(event.target.error);
    });
  }

  async clearSyncedSubmissions() {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allItems = request.result;
        const deleteRequests = allItems
          .filter(item => item.synced)
          .map(item => store.delete(item.localId));

        Promise.all(deleteRequests)
          .then(() => resolve())
          .catch(error => reject(error));
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }
}

export const offlineManager = new OfflineManager();