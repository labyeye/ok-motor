// src/components/NetworkStatus.js
import React, { useState, useEffect } from 'react';
import networkService from '../services/networkService';
import syncService from '../services/syncService';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribeNetwork = networkService.subscribe((online) => {
      setIsOnline(online);
    });

    // Subscribe to sync events
    const unsubscribeSync = syncService.subscribe((event, data) => {
      if (event === 'sync-start') {
        setIsSyncing(true);
      } else if (event === 'sync-complete' || event === 'sync-error') {
        setIsSyncing(false);
        updateUnsyncedCount();
      }
    });

    updateUnsyncedCount();

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  const updateUnsyncedCount = async () => {
    const stats = await syncService.getSyncStatistics();
    if (stats.success) {
      const total = Object.values(stats.collections).reduce(
        (sum, col) => sum + col.unsynced,
        0
      );
      setUnsyncedCount(total);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      await syncService.forceSyncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <div className="network-status-widget">
      <div 
        className="network-status-indicator"
        onClick={() => setShowDetails(!showDetails)}
        title={isOnline ? 'Online' : 'Offline - Working locally'}
      >
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
        <span className="status-text">
          {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
        </span>
        {!isOnline && unsyncedCount > 0 && (
          <span className="unsynced-badge">{unsyncedCount}</span>
        )}
      </div>

      {showDetails && (
        <div className="network-status-details">
          <div className="status-detail-row">
            <span>Status:</span>
            <strong>{isOnline ? '🟢 Connected' : '🔴 Disconnected'}</strong>
          </div>
          
          {!isOnline && (
            <div className="status-detail-row">
              <span>Pending sync:</span>
              <strong>{unsyncedCount} items</strong>
            </div>
          )}

          {isSyncing && (
            <div className="status-detail-row syncing">
              <span className="sync-spinner"></span>
              <span>Syncing data...</span>
            </div>
          )}

          {isOnline && !isSyncing && (
            <button 
              className="sync-now-btn"
              onClick={handleSync}
            >
              Sync Now
            </button>
          )}

          <div className="status-message">
            {isOnline 
              ? 'All changes are being saved to the server'
              : 'Working offline - Changes will sync when connection is restored'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;
