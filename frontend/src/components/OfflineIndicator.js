import React, { useState, useEffect } from "react";
import swManager from "../utils/serviceWorkerManager";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    // Register callback with service worker manager
    const handleNetworkChange = ({ type, data, isOnline: online }) => {
      setIsOnline(online);

      switch (type) {
        case "OFFLINE":
          setShowOfflineMessage(true);
          setSyncStatus("offline");
          break;
        case "ONLINE":
          setShowOfflineMessage(false);
          setSyncStatus("syncing");
          // Hide sync status after a delay
          setTimeout(() => setSyncStatus(null), 3000);
          break;
        case "SYNC_SUCCESS":
          setSyncStatus("synced");
          setTimeout(() => setSyncStatus(null), 2000);
          break;
        default:
          break;
      }
    };

    swManager.addCallback(handleNetworkChange);

    // Update queue count periodically
    const updateQueueCount = () => {
      const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
      setQueueCount(storedQueue.length);
    };

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      swManager.removeCallback(handleNetworkChange);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return "#ff4444";
    if (syncStatus === "syncing") return "#ff9800";
    if (syncStatus === "synced") return "#4caf50";
    return "#4caf50";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === "syncing") return "Syncing...";
    if (syncStatus === "synced") return "Synced";
    return "Online";
  };

  const styles = {
    container: {
      position: "fixed",
      top: "10px",
      right: "10px",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    indicator: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "20px",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      fontSize: "12px",
      fontWeight: "500",
      backdropFilter: "blur(10px)",
      border: `1px solid ${getStatusColor()}`,
      transition: "all 0.3s ease",
    },
    dot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: getStatusColor(),
      animation: syncStatus === "syncing" ? "pulse 1.5s infinite" : "none",
    },
    offlineMessage: {
      position: "fixed",
      top: "60px",
      right: "10px",
      padding: "12px 16px",
      backgroundColor: "#ff4444",
      color: "white",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      transform: showOfflineMessage ? "translateY(0)" : "translateY(-100px)",
      opacity: showOfflineMessage ? 1 : 0,
      transition: "all 0.3s ease",
      maxWidth: "300px",
    },
    queueBadge: {
      backgroundColor: "#ff9800",
      color: "white",
      borderRadius: "10px",
      padding: "2px 6px",
      fontSize: "10px",
      fontWeight: "bold",
      minWidth: "16px",
      textAlign: "center",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      <div style={styles.container}>
        <div style={styles.indicator}>
          <div style={styles.dot}></div>
          <span>{getStatusText()}</span>
          {queueCount > 0 && <div style={styles.queueBadge}>{queueCount}</div>}
        </div>
      </div>

      <div style={styles.offlineMessage}>
        <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
          You're offline
        </div>
        <div style={{ fontSize: "12px", opacity: 0.9 }}>
          Your changes will be saved and synced when you're back online.
          {queueCount > 0 && ` ${queueCount} actions pending.`}
        </div>
      </div>
    </>
  );
};

export default OfflineIndicator;
