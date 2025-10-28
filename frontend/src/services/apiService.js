// src/services/apiService.js
/**
 * API Service - Unified API layer
 * Routes requests to online API or offline storage based on network status
 */

import axios from 'axios';
import offlineStorage from './offlineStorage';
import networkService from './networkService';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL
    });

    // Set up axios interceptors
    this.setupInterceptors();
    
    // Set API URL for network health checks
    networkService.setApiUrl(`${this.baseURL}/api/health`);
  }

  /**
   * Setup axios interceptors for auth and error handling
   */
  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // If network error and we're offline, don't throw
        if (!networkService.getStatus() && 
            (error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
          console.log('Network error detected - using offline mode');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if we should use offline mode
   */
  shouldUseOffline() {
    return !networkService.getStatus();
  }

  /**
   * Generic request handler that routes to online or offline
   */
  async request(method, endpoint, data = null, useOffline = null) {
    const offline = useOffline !== null ? useOffline : this.shouldUseOffline();

    if (offline) {
      return this.handleOfflineRequest(method, endpoint, data);
    }

    try {
      const response = await this.axiosInstance({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error) {
      // If network error, fallback to offline
      if (error.code === 'ERR_NETWORK' || !networkService.getStatus()) {
        console.log('Network error - falling back to offline mode');
        return this.handleOfflineRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  /**
   * Handle offline requests
   */
  async handleOfflineRequest(method, endpoint, data) {
    // Parse endpoint to determine collection and action
    const parts = endpoint.split('/').filter(p => p);
    const collection = this.getCollectionFromEndpoint(parts[parts.length - 1] || parts[0]);

    switch (method.toUpperCase()) {
      case 'GET':
        return this.handleOfflineGet(collection, endpoint);
      case 'POST':
        return this.handleOfflinePost(collection, data);
      case 'PUT':
      case 'PATCH':
        return this.handleOfflinePut(collection, endpoint, data);
      case 'DELETE':
        return this.handleOfflineDelete(collection, endpoint);
      default:
        throw new Error(`Unsupported offline method: ${method}`);
    }
  }

  /**
   * Map endpoint to collection name
   */
  getCollectionFromEndpoint(endpoint) {
    const mapping = {
      'buy-letters': 'buyLetters',
      'sell-letters': 'sellLetters',
      'service-bills': 'serviceBills',
      'advance-bills': 'advanceBills',
      'users': 'users'
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (endpoint.includes(key)) {
        return value;
      }
    }

    return endpoint;
  }

  /**
   * Handle offline GET request
   */
  async handleOfflineGet(collection, endpoint) {
    // Check if requesting by ID
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);
    
    if (idMatch) {
      const id = idMatch[1];
      const result = await offlineStorage.findById(collection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        throw new Error('Document not found');
      }
    } else {
      // Get all documents
      const result = await offlineStorage.find(collection);
      return { success: true, data: result.data || [] };
    }
  }

  /**
   * Handle offline POST request (create)
   */
  async handleOfflinePost(collection, data) {
    const result = await offlineStorage.create(collection, data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error);
    }
  }

  /**
   * Handle offline PUT/PATCH request (update)
   */
  async handleOfflinePut(collection, endpoint, data) {
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);
    
    if (!idMatch) {
      throw new Error('ID required for update');
    }

    const id = idMatch[1];
    const result = await offlineStorage.updateById(collection, id, data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error);
    }
  }

  /**
   * Handle offline DELETE request
   */
  async handleOfflineDelete(collection, endpoint) {
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);
    
    if (!idMatch) {
      throw new Error('ID required for delete');
    }

    const id = idMatch[1];
    const result = await offlineStorage.deleteById(collection, id);
    
    if (result.success) {
      return { success: true, message: 'Document deleted' };
    } else {
      throw new Error(result.error);
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}

export default new ApiService();
