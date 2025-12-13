// src/services/initOfflineServices.js
/**
 * Initialize all offline services
 * Call this once when your app starts
 */

import networkService from './networkService';
import syncService from './syncService';
import apiService from './apiService';

let initialized = false;

export const initOfflineServices = () => {
  if (initialized) {
    console.log('Offline services already initialized');
    return;
  }

  console.log('🚀 Initializing offline services...');

  // Set API URL for network health checks
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  networkService.setApiUrl(`${apiUrl}/api/health`);

  // Start automatic sync (can be disabled in Settings)
  syncService.setAutoSync(true);

  // Log network status changes (optional)
  networkService.subscribe((isOnline, wasOnline) => {
    if (isOnline && !wasOnline) {
      console.log('📡 Connection resto#ff6b00');
    } else if (!isOnline && wasOnline) {
      console.log('📡 Connection lost - working offline');
    }
  });

  // Log sync events (optional)
  syncService.subscribe((event, data) => {
    if (event === 'sync-start') {
      console.log('🔄 Starting sync...');
    } else if (event === 'sync-complete') {
      console.log('✅ Sync completed successfully');
    } else if (event === 'sync-error') {
      console.error('❌ Sync error:', data.error);
    }
  });

  initialized = true;
  console.log('✅ Offline services initialized');
  console.log(`📡 Network status: ${networkService.getStatus() ? 'Online' : 'Offline'}`);
};

export const getServicesStatus = () => {
  return {
    initialized,
    isOnline: networkService.getStatus(),
    syncStatus: syncService.getSyncStatus()
  };
};

export default initOfflineServices;
