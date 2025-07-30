import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
  Eye,
  Trash2,
} from "lucide-react";
import offlineSyncManager from "../utils/offlineSyncManager";

const OfflineSyncStatus = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ queueLength: 0, items: [] });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync manager callback
    const syncCallback = ({ event, data }) => {
      const status = offlineSyncManager.getQueueStatus();
      setQueueStatus(status);
      setIsOnline(status.isOnline);

      switch (event) {
        case "FORM_QUEUED":
          setSyncStatus("queued");
          break;
        case "SYNC_STARTED":
          setSyncStatus("syncing");
          setSyncProgress({ current: 0, total: status.queueLength });
          break;
        case "SYNC_PROGRESS":
          setSyncProgress({ current: data.current, total: data.total });
          break;
        case "SYNC_SUCCESS":
          setSyncStatus("success");
          setTimeout(() => setSyncStatus(null), 3000);
          break;
        case "SYNC_FAILED":
          setSyncStatus("failed");
          break;
        case "ONLINE":
          setSyncStatus("syncing");
          break;
        case "OFFLINE":
          setSyncStatus(null);
          break;
        default:
          break;
      }
    };

    offlineSyncManager.addCallback(syncCallback);

    // Initial status
    const initialStatus = offlineSyncManager.getQueueStatus();
    setQueueStatus(initialStatus);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleRetrySync = async () => {
    if (isOnline && queueStatus.queueLength > 0) {
      setSyncStatus("syncing");
      await offlineSyncManager.triggerSync();
    }
  };

  const handleRemoveQueueItem = async (itemId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this item from the sync queue?"
      )
    ) {
      // This would need to be implemented in offlineSyncManager
      console.log("Remove queue item:", itemId);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} className="text-red-500" />;

    switch (syncStatus) {
      case "queued":
        return <Clock size={16} className="text-yellow-500" />;
      case "syncing":
        return <RotateCcw size={16} className="text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle size={16} className="text-green-500" />;
      case "failed":
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Wifi size={16} className="text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return `Offline (${queueStatus.queueLength} queued)`;
    }

    switch (syncStatus) {
      case "queued":
        return `${queueStatus.queueLength} items queued`;
      case "syncing":
        return `Syncing... (${syncProgress.current}/${syncProgress.total})`;
      case "success":
        return "Sync completed";
      case "failed":
        return "Sync failed";
      default:
        return queueStatus.queueLength > 0
          ? `${queueStatus.queueLength} pending`
          : "Online";
    }
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Don't show if online and no queue items
  if (isOnline && queueStatus.queueLength === 0 && !syncStatus) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        maxWidth: "400px",
      }}
    >
      {/* Status Indicator */}
      <div
        onClick={handleToggleVisibility}
        style={{
          backgroundColor: isOnline ? "#10b981" : "#ef4444",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          marginBottom: isVisible ? "8px" : "0",
          transition: "all 0.3s ease",
        }}
      >
        {getStatusIcon()}
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          {getStatusText()}
        </span>
        <Eye size={14} style={{ opacity: 0.7 }} />
      </div>

      {/* Detailed Panel */}
      {isVisible && (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: "400px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Sync Status
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {isOnline && queueStatus.queueLength > 0 && (
                <button
                  onClick={handleRetrySync}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              )}
              <button
                onClick={handleToggleVisibility}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Queue Items */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: "300px",
            }}
          >
            {queueStatus.items.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                No items in sync queue
              </div>
            ) : (
              queueStatus.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      index < queueStatus.items.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px",
                      }}
                    >
                      {item.userFriendlyName || `${item.type} submission`}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      {item.method} {item.endpoint}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Queued: {formatDateTime(item.timestamp)}
                    </div>
                    {item.attempts > 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#ef4444",
                          marginTop: "2px",
                        }}
                      >
                        Failed attempts: {item.attempts}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor:
                          item.attempts > 0 ? "#fef2f2" : "#f0f9ff",
                        color: item.attempts > 0 ? "#dc2626" : "#0369a1",
                        fontWeight: "500",
                      }}
                    >
                      {item.type}
                    </span>
                    <button
                      onClick={() => handleRemoveQueueItem(item.id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "2px",
                      }}
                      title="Remove from queue"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              fontSize: "12px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {isOnline ? "Connected" : "Offline - data will sync when connected"}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncStatus;
