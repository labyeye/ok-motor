// src/services/networkService.js
/**
 * Network Detection Service
 * Monitors online/offline status and provides connectivity information
 */

class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.apiHealthCheckUrl = null;
    this.healthCheckInterval = null;
    this.healthCheckIntervalTime = 30000; // 30 seconds
    
    this.init();
  }

  /**
   * Initialize network monitoring
   */
  init() {
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initial check
    this.checkConnection();
  }

  /**
   * Set API URL for health checks
   */
  setApiUrl(url) {
    this.apiHealthCheckUrl = url;
    this.startHealthCheck();
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkConnection();
    }, this.healthCheckIntervalTime);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Browser detected online');
    this.checkConnection();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Browser detected offline');
    this.updateStatus(false);
  }

  /**
   * Check actual connection to API server
   */
  async checkConnection() {
    // First check browser's online status
    if (!navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    // If API URL is set, check if server is reachable
    if (this.apiHealthCheckUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(this.apiHealthCheckUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);
        
        const online = response.ok || response.status === 401; // 401 means server is up but needs auth
        this.updateStatus(online);
        return online;
      } catch (error) {
        console.log('API health check failed:', error.message);
        this.updateStatus(false);
        return false;
      }
    } else {
      // No API URL set, just use browser status
      this.updateStatus(navigator.onLine);
      return navigator.onLine;
    }
  }

  /**
   * Update online status and notify listeners
   */
  updateStatus(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(isOnline, wasOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { isOnline, wasOnline }
    }));
  }

  /**
   * Subscribe to network status changes
   * @param {Function} callback - Called with (isOnline, wasOnline)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Call immediately with current status
    callback(this.isOnline, this.isOnline);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current online status
   */
  getStatus() {
    return this.isOnline;
  }

  /**
   * Force a connection check
   */
  async forceCheck() {
    return await this.checkConnection();
  }

  /**
   * Clean up resources
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopHealthCheck();
    this.listeners = [];
  }
}

export default new NetworkService();
