import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import offlineSyncManager from "../utils/offlineSyncManager";

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  const [queueStatus, setQueueStatus] = useState({ queueLength: 0, items: [] });
  const [lastSyncMessage, setLastSyncMessage] = useState("");

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
          setLastSyncMessage(data.message);
          break;
        case "SYNC_STARTED":
          setSyncStatus("syncing");
          setLastSyncMessage("Syncing data...");
          break;
        case "SYNC_SUCCESS":
          setSyncStatus("success");
          setLastSyncMessage(data.message);
          // Clear success message after 5 seconds
          setTimeout(() => {
            setSyncStatus(null);
            setLastSyncMessage("");
          }, 5000);
          break;
        case "SYNC_FAILED":
          setSyncStatus("failed");
          setLastSyncMessage(data.message);
          break;
        case "ONLINE":
          setSyncStatus("syncing");
          setLastSyncMessage("Reconnected! Syncing pending changes...");
          break;
        case "OFFLINE":
          setSyncStatus(null);
          setLastSyncMessage("");
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

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} />;

    switch (syncStatus) {
      case "queued":
        return <Clock size={16} />;
      case "syncing":
        return <RotateCcw size={16} className="animate-spin" />;
      case "success":
        return <CheckCircle size={16} />;
      case "failed":
        return <AlertTriangle size={16} />;
      default:
        return <Wifi size={16} />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "#ef4444"; // red

    switch (syncStatus) {
      case "queued":
        return "#f59e0b"; // amber
      case "syncing":
        return "#3b82f6"; // blue
      case "success":
        return "#10b981"; // green
      case "failed":
        return "#ef4444"; // red
      default:
        return "#10b981"; // green when online
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      const queueCount = queueStatus.queueLength;
      return queueCount > 0
        ? `Offline - ${queueCount} item${
            queueCount !== 1 ? "s" : ""
          } queued for sync`
        : "You're currently offline";
    }

    if (lastSyncMessage) {
      return lastSyncMessage;
    }

    const queueCount = queueStatus.queueLength;
    if (queueCount > 0) {
      return `Online - ${queueCount} item${
        queueCount !== 1 ? "s" : ""
      } pending sync`;
    }

    return "You're online";
  };

  const handleRetrySync = async () => {
    if (isOnline && queueStatus.queueLength > 0) {
      setSyncStatus("syncing");
      setLastSyncMessage("Retrying sync...");
      await offlineSyncManager.triggerSync();
    }
  };

  // Don't show banner if online and no messages
  if (isOnline && !lastSyncMessage && queueStatus.queueLength === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: getStatusColor(),
        color: "white",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "background-color 0.3s ease",
      }}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>

      {/* Retry button for failed syncs */}
      {isOnline && syncStatus === "failed" && queueStatus.queueLength > 0 && (
        <button
          onClick={handleRetrySync}
          style={{
            marginLeft: "12px",
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
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

      {/* Queue details for debugging */}
      {queueStatus.queueLength > 0 && (
        <span
          style={{
            marginLeft: "12px",
            fontSize: "12px",
            opacity: 0.8,
          }}
        >
          ({queueStatus.items.map((item) => item.type).join(", ")})
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
