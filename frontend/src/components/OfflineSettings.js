import React, { useState, useEffect } from "react";
import cacheManager from "../utils/cacheManager";
import { useOfflineQueue } from "../hooks/useOfflineData";

const OfflineSettings = ({ isOpen, onClose }) => {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [storageQuota, setStorageQuota] = useState(null);
  const [loading, setLoading] = useState(false);
  const { queueStatus, clearQueue } = useOfflineQueue();

  useEffect(() => {
    if (isOpen) {
      loadCacheInfo();
      loadStorageQuota();
    }
  }, [isOpen]);

  const loadCacheInfo = async () => {
    setLoading(true);
    try {
      const info = await cacheManager.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error("Error loading cache info:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageQuota = async () => {
    try {
      const quota = await cacheManager.getStorageQuota();
      setStorageQuota(quota);
    } catch (error) {
      console.error("Error loading storage quota:", error);
    }
  };

  const handleClearCache = async (cacheName) => {
    try {
      await cacheManager.clearCache(cacheName);
      await loadCacheInfo();
      alert(`Cache "${cacheName}" cleared successfully`);
    } catch (error) {
      alert(`Error clearing cache: ${error.message}`);
    }
  };

  const handleClearAllCaches = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all caches? This will remove all offline data."
      )
    ) {
      try {
        const result = await cacheManager.clearAllCaches();
        await loadCacheInfo();
        alert(`Cleared ${result.cleared} out of ${result.total} caches`);
      } catch (error) {
        alert(`Error clearing caches: ${error.message}`);
      }
    }
  };

  const handlePreloadResources = async () => {
    try {
      const result = await cacheManager.preloadCriticalResources();
      await loadCacheInfo();
      if (result.success) {
        alert(
          `Preloaded ${result.successful} out of ${result.total} resources`
        );
      } else {
        alert(`Failed to preload resources: ${result.reason}`);
      }
    } catch (error) {
      alert(`Error preloading resources: ${error.message}`);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      const result = await cacheManager.cleanupExpiredCache();
      await loadCacheInfo();
      if (result.success) {
        alert(`Cleaned up ${result.cleaned} expired entries`);
      } else {
        alert(`Error cleaning up cache: ${result.reason}`);
      }
    } catch (error) {
      alert(`Error cleaning up cache: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "20px",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      maxWidth: "600px",
      width: "100%",
      maxHeight: "80vh",
      overflow: "auto",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    },
    header: {
      padding: "20px",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      margin: 0,
      fontSize: "20px",
      fontWeight: "600",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      padding: "0",
      color: "#666",
    },
    content: {
      padding: "20px",
    },
    section: {
      marginBottom: "24px",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "12px",
      color: "#333",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "16px",
    },
    infoCard: {
      padding: "12px",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      border: "1px solid #e9ecef",
    },
    infoLabel: {
      fontSize: "12px",
      color: "#666",
      textTransform: "uppercase",
      fontWeight: "600",
      marginBottom: "4px",
    },
    infoValue: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
    },
    button: {
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginRight: "8px",
      marginBottom: "8px",
      transition: "all 0.2s",
    },
    primaryButton: {
      backgroundColor: "#2196f3",
      color: "white",
    },
    dangerButton: {
      backgroundColor: "#f44336",
      color: "white",
    },
    secondaryButton: {
      backgroundColor: "#6c757d",
      color: "white",
    },
    cacheList: {
      marginTop: "12px",
    },
    cacheItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px",
      backgroundColor: "#f8f9fa",
      borderRadius: "6px",
      marginBottom: "8px",
    },
    cacheInfo: {
      flex: 1,
    },
    cacheName: {
      fontWeight: "600",
      marginBottom: "4px",
    },
    cacheStats: {
      fontSize: "12px",
      color: "#666",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Offline Settings</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {loading && <div>Loading cache information...</div>}

          {/* Storage Quota */}
          {storageQuota && storageQuota.supported && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Storage Usage</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Used</div>
                  <div style={styles.infoValue}>
                    {storageQuota.usageFormatted || "0 Bytes"}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Available</div>
                  <div style={styles.infoValue}>
                    {storageQuota.quotaFormatted || "Unknown"}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Usage</div>
                  <div style={styles.infoValue}>
                    {storageQuota.usagePercentage || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offline Queue */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Offline Queue</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Pending Requests</div>
                <div style={styles.infoValue}>{queueStatus.count}</div>
              </div>
            </div>
            {queueStatus.count > 0 && (
              <button
                style={{ ...styles.button, ...styles.dangerButton }}
                onClick={clearQueue}
              >
                Clear Queue
              </button>
            )}
          </div>

          {/* Cache Information */}
          {cacheInfo && cacheInfo.supported && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Cache Storage</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Total Size</div>
                  <div style={styles.infoValue}>
                    {cacheInfo.totalSizeFormatted || "0 Bytes"}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Total Caches</div>
                  <div style={styles.infoValue}>{cacheInfo.totalCaches}</div>
                </div>
              </div>

              <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handlePreloadResources}
                >
                  Preload Resources
                </button>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={handleCleanupExpired}
                >
                  Cleanup Expired
                </button>
                <button
                  style={{ ...styles.button, ...styles.dangerButton }}
                  onClick={handleClearAllCaches}
                >
                  Clear All Caches
                </button>
              </div>

              {Object.keys(cacheInfo.caches || {}).length > 0 && (
                <div style={styles.cacheList}>
                  {Object.entries(cacheInfo.caches).map(([name, info]) => (
                    <div key={name} style={styles.cacheItem}>
                      <div style={styles.cacheInfo}>
                        <div style={styles.cacheName}>{name}</div>
                        <div style={styles.cacheStats}>
                          {info.entries} entries • {info.sizeFormatted}
                        </div>
                      </div>
                      <button
                        style={{ ...styles.button, ...styles.dangerButton }}
                        onClick={() => handleClearCache(name)}
                      >
                        Clear
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Actions</h3>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={loadCacheInfo}
            >
              Refresh Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineSettings;
