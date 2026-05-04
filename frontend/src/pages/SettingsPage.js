import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AppSidebar from "../components/common/AppSidebar";
import networkService from "../services/networkService";
import syncService from "../services/syncService";
import fileSaveService from "../services/fileSaveService";
import { PDFDocument, StandardFonts } from "pdf-lib";

const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [storagePath, setStoragePath] = useState("");
  const [saveDirs, setSaveDirs] = useState({});
  const [, setSyncStatus] = useState({});
  const [syncStats, setSyncStats] = useState({});
  const [autoSync, setAutoSync] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadSettings();
    loadSyncStats();

    (async () => {
      if (window.electronAPI && window.electronAPI.getSaveDirs) {
        const res = await window.electronAPI.getSaveDirs();
        if (res && res.success) setSaveDirs(res.data || {});
      }
    })();

    const unsubscribeNetwork = networkService.subscribe((online) => {
      setIsOnline(online);
    });

    const unsubscribeSync = syncService.subscribe((event, data) => {
      if (event === "sync-start") {
        setIsSyncing(true);
        showMessage("info", "Syncing data...");
      } else if (event === "sync-complete") {
        setIsSyncing(false);
        loadSyncStats();
        showMessage("success", "Sync completed successfully!");
        setLastSyncTime(new Date());
      } else if (event === "sync-error") {
        setIsSyncing(false);
        showMessage("error", `Sync error: ${data.error}`);
      }
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  const loadSettings = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.getStoragePath();
      setStoragePath(path);
    }

    const status = syncService.getSyncStatus();
    setSyncStatus(status);
    setAutoSync(status.autoSyncEnabled);
    setIsOnline(status.isOnline);

    if (status.lastSyncTime) {
      setLastSyncTime(new Date(status.lastSyncTime));
    }
  };

  const loadSyncStats = async () => {
    const stats = await syncService.getSyncStatistics();
    if (stats.success) {
      setSyncStats(stats.collections || {});
    }
  };

  const handleSelectPath = async () => {
    if (!window.electronAPI) {
      showMessage("error", "Path selection is only available in desktop app");
      return;
    }

    const result = await window.electronAPI.selectStoragePath();
    if (result.success) {
      setStoragePath(result.path);
      showMessage("success", `Storage path updated to: ${result.path}`);
    } else if (!result.canceled) {
      showMessage("error", "Failed to update storage path");
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      showMessage("error", "Cannot sync while offline");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncService.forceSyncNow();
      if (result.success) {
        loadSyncStats();
        showMessage("success", "Manual sync completed!");
        setLastSyncTime(new Date());
      } else {
        showMessage("error", result.message || "Sync failed");
      }
    } catch (error) {
      showMessage("error", error.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSyncToggle = (e) => {
    const enabled = e.target.checked;
    setAutoSync(enabled);
    syncService.setAutoSync(enabled);
    showMessage("info", `Auto-sync ${enabled ? "enabled" : "disabled"}`);
  };

  const handleOpenPDFFolder = async () => {
    if (!window.electronAPI) {
      showMessage("error", "This feature is only available in desktop app");
      return;
    }

    const result = await window.electronAPI.openPDFDirectory();
    if (result.success) {
      showMessage("success", "Opened PDF directory");
    } else {
      showMessage("error", "Failed to open PDF directory");
    }
  };

  const handleSelectSaveDir = async (docType) => {
    if (!window.electronAPI || !window.electronAPI.selectSaveDir) {
      showMessage(
        "error",
        "Directory selection is only available in desktop app",
      );
      return;
    }

    const result = await window.electronAPI.selectSaveDir(docType);
    if (result && result.success) {
      setSaveDirs((prev) => ({ ...prev, [docType]: result.path }));
      showMessage(
        "success",
        `Save directory for ${docType} set to ${result.path}`,
      );
    } else if (!result.canceled) {
      showMessage("error", "Failed to set save directory");
    }
  };

  const handleClearSaveDir = async (docType) => {
    if (window.electronAPI && window.electronAPI.clearSaveDir) {
      const res = await window.electronAPI.clearSaveDir(docType);
      if (res && res.success) {
        setSaveDirs((prev) => {
          const copy = { ...prev };
          delete copy[docType];
          return copy;
        });
        showMessage("success", `Cleared save directory for ${docType}`);
        return;
      }
      showMessage("error", `Failed to clear save directory for ${docType}`);
      return;
    }

    setSaveDirs((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    showMessage("success", `Cleared save directory for ${docType}`);
  };

  const handleTestSaveDir = async (docType) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([300, 200]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(`OK Motor test save - ${docType}`, {
        x: 20,
        y: 100,
        size: 12,
        font,
      });
      const pdfBytes = await pdfDoc.save();
      const filename = `okmotor-test-${docType}.pdf`;

      const res = await fileSaveService.savePdfToDefaultDir(
        filename,
        pdfBytes,
        docType,
      );
      if (res && res.success) {
        showMessage(
          "success",
          `Test PDF saved${res.path ? ` to ${res.path}` : ""}`,
        );
      } else {
        showMessage(
          "error",
          `Test save failed${res && res.error ? `: ${res.error}` : ""}`,
        );
      }
    } catch (error) {
      console.error("Test save failed:", error);
      showMessage("error", `Test save failed: ${error.message}`);
    }
  };

  const handleExportData = async () => {
    if (!window.electronAPI) {
      showMessage("error", "Export is only available in desktop app");
      return;
    }

    try {
      const result = await window.electronAPI.exportAllData();
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMessage("success", "Data exported successfully!");
      }
    } catch (error) {
      showMessage("error", "Export failed: " + error.message);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const formatTime = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
      width: "280px",
      backgroundColor: "#071952",
      color: "#f8fafc",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      position: "sticky",
      top: 0,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "hidden",
      transition: "transform 0.3s ease",
    },
    sidebarHeader: {
      padding: "24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    nav: {
      padding: "16px 0",
      flex: "1 1 auto",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      cursor: "pointer",
      color: "#e2e8f0",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    menuItemActive: {
      backgroundColor: "rgba(8, 131, 149, 0.2)",
      borderRight: "3px solid #088395",
      color: "#ffffff",
    },
    menuItemContent: {
      display: "flex",
      alignItems: "center",
    },
    menuIcon: {
      marginRight: "12px",
      color: "#94a3b8",
    },
    menuText: {
      fontSize: "0.9375rem",
      fontWeight: "500",
    },
    submenu: {
      backgroundColor: "rgba(26, 32, 44, 0.7)",
      maxHeight: 0,
      opacity: 0,
      overflow: "hidden",
      transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
    },
    submenuItem: {
      padding: "10px 24px 10px 64px",
      cursor: "pointer",
      color: "#cbd5e1",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
    },
    logoutButton: {
      display: "flex",
      alignItems: "center",
      padding: "12px 24px",
      cursor: "pointer",
      color: "#f87171",
      marginTop: "16px",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      transition: "all 0.2s ease",
    },
    mainContent: {
      flex: 1,
      overflow: "auto",
      backgroundColor: "#ffffff",
    },
    contentPadding: {
      padding: "32px",
    },
    topBar: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "#071952",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: 20,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 1rem",
    },
    topBarLogo: {
      width: "250px",
      height: "auto",
      margin: "-40px",
      padding: 0,
      display: "block",
    },
    hamburgerMenu: {
      cursor: "pointer",
      padding: "8px",
      borderRadius: "4px",
      transition: "background-color 0.2s",
      position: "absolute",
      left: "1rem",
      color: "#ffffff",
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      zIndex: 14,
    },
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                  marginBottom: "2rem",
                  paddingBottom: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                Settings
              </h1>

              {}
              <section
                style={{
                  marginBottom: "2rem",
                  paddingBottom: "2rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "1rem",
                  }}
                >
                  Network Status
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    background: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: isOnline ? "#10b981" : "#ef4444",
                      animation: "pulse 2s infinite",
                    }}
                  ></span>
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  {isSyncing && (
                    <span
                      style={{
                        color: "#3b82f6",
                        fontStyle: "italic",
                      }}
                    >
                      {" "}
                      • Syncing...
                    </span>
                  )}
                </div>
              </section>

              {}
              {window.electronAPI && (
                <section
                  style={{
                    marginBottom: "2rem",
                    paddingBottom: "2rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "1rem",
                    }}
                  >
                    Storage Location
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "1rem",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <input
                      type="text"
                      value={storagePath}
                      readOnly
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        background: "#f9fafb",
                      }}
                    />
                    <button
                      onClick={handleSelectPath}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "#088395",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      Change Location
                    </button>
                  </div>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    All offline data and PDFs will be stored in this location
                  </p>
                  <button
                    onClick={handleOpenPDFFolder}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      marginTop: "1rem",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    Open PDF Folder
                  </button>
                </section>
              )}

              {}
              <section
                style={{
                  marginBottom: "2rem",
                  paddingBottom: "2rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "1rem",
                  }}
                >
                  Sync Settings
                </h2>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={handleAutoSyncToggle}
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                      }}
                    />
                    <span>Enable Automatic Sync</span>
                  </label>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    Automatically sync offline data when connection is restored
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? "1rem" : "0",
                  }}
                >
                  <p style={{ margin: 0, color: "#6b7280" }}>
                    <strong>Last Sync:</strong> {formatTime(lastSyncTime)}
                  </p>
                  <button
                    onClick={handleManualSync}
                    disabled={!isOnline || isSyncing}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background:
                        !isOnline || isSyncing ? "#9ca3af" : "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      cursor:
                        !isOnline || isSyncing ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </button>
                </div>
              </section>

              {}
              <section
                style={{
                  marginBottom: "2rem",
                  paddingBottom: "2rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "1rem",
                  }}
                >
                  Sync Statistics
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {Object.keys(syncStats).length > 0 ? (
                    Object.entries(syncStats).map(([collection, stats]) => (
                      <div
                        key={collection}
                        style={{
                          background: "#f9fafb",
                          padding: "1.5rem",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "1rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {collection}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ color: "#6b7280", fontSize: "0.9rem" }}
                            >
                              Total:
                            </span>
                            <span
                              style={{
                                fontWeight: "600",
                                fontSize: "1.1rem",
                                color: "#1f2937",
                              }}
                            >
                              {stats.total}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ color: "#6b7280", fontSize: "0.9rem" }}
                            >
                              Synced:
                            </span>
                            <span
                              style={{
                                fontWeight: "600",
                                fontSize: "1.1rem",
                                color: "#10b981",
                              }}
                            >
                              {stats.synced}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ color: "#6b7280", fontSize: "0.9rem" }}
                            >
                              Pending:
                            </span>
                            <span
                              style={{
                                fontWeight: "600",
                                fontSize: "1.1rem",
                                color: "#f59e0b",
                              }}
                            >
                              {stats.unsynced}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: "2rem",
                        fontStyle: "italic",
                      }}
                    >
                      No sync data available
                    </p>
                  )}
                </div>
              </section>

              {}
              <section
                style={{
                  marginBottom: "2rem",
                  paddingBottom: "2rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "1rem",
                  }}
                >
                  Data Management
                </h2>
                <button
                  onClick={handleExportData}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Export All Data (Backup)
                </button>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Export all offline data as a JSON backup file
                </p>
              </section>

              {}
              {window.electronAPI && (
                <section
                  style={{ marginBottom: "2rem", paddingBottom: "2rem" }}
                >
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "1rem",
                    }}
                  >
                    Default PDF Save Locations
                  </h2>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {["buy", "sell", "service", "advance"].map((type) => (
                      <div
                        key={type}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 90,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {type}
                        </div>
                        <input
                          type="text"
                          value={saveDirs[type] || ""}
                          readOnly
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                            background: "#fafafa",
                          }}
                        />
                        <button
                          onClick={() => handleSelectSaveDir(type)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                          }}
                        >
                          Choose
                        </button>
                        <button
                          onClick={() => handleTestSaveDir(type)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                          }}
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleClearSaveDir(type)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    When set, PDFs for that document type will be saved
                    automatically to the chosen folder without showing a save
                    dialog.
                  </p>
                </section>
              )}

              {}
              {message.text && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    marginTop: "1rem",
                    fontWeight: "500",
                    background:
                      message.type === "success"
                        ? "#d1fae5"
                        : message.type === "error"
                          ? "#fee2e2"
                          : "#dbeafe",
                    color:
                      message.type === "success"
                        ? "#065f46"
                        : message.type === "error"
                          ? "#991b1b"
                          : "#1e40af",
                    border: `1px solid ${
                      message.type === "success"
                        ? "#10b981"
                        : message.type === "error"
                          ? "#ef4444"
                          : "#3b82f6"
                    }`,
                  }}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
