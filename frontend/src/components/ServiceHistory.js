import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  ShipWheel,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Download,
  Trash2,
  Bike,
  Pencil,
  Menu,
  X,
  Settings,
  RefreshCw,
  Megaphone,
  Image,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import pdfService from "../services/pdfService";

import logo from "../images/company.png";
import config from "../config/environment";
import ConfirmModal from "./ConfirmModal";
import PdfPreview from "./PdfPreview";

const ServiceHistory = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Service History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [serviceBills, setServiceBills] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [sellHistory, setSellHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showVehicleHistory, setShowVehicleHistory] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const navigate = useNavigate();

  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewBill, setPreviewBill] = useState(null);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesList, setChangesList] = useState([]);
  const [changesTargetBill, setChangesTargetBill] = useState(null);
  const [isComputingChanges, setIsComputingChanges] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    let ds = dateString;
    try {
      if (typeof ds === "string" && ds.includes("T")) ds = ds.split("T")[0];
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      return "";
    }
  };
  const simulateProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDownloadProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const isOnline = navigator.onLine;

        if (isOnline) {
          const serviceResponse = await axios.get(
            `https://ok-motor-51l3.vercel.app/api/service-bills?page=${currentPage}`,
          );
          const serviceData =
            serviceResponse.data.data || serviceResponse.data || [];
          setTotalPages(serviceResponse.data.totalPages || 1);

          // If some bills have previousVersionId, fetch those previous docs
          try {
            const prevIds = serviceData
              .map((b) => b.previousVersionId)
              .filter((id) => !!id);

            if (prevIds.length > 0) {
              const token = localStorage.getItem("token");
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const uniquePrevIds = [...new Set(prevIds)];
              const prevFetches = await Promise.all(
                uniquePrevIds.map((id) =>
                  axios
                    .get(
                      `https://ok-motor-51l3.vercel.app/api/service-bills/${id}`,
                      {
                        headers,
                      },
                    )
                    .then((r) => r.data.data || r.data)
                    .catch(() => null),
                ),
              );

              const prevMap = {};
              uniquePrevIds.forEach((id, idx) => {
                const p = prevFetches[idx];
                if (p) {
                  p._isPreviousVersion = true;
                  prevMap[id] = p;
                }
              });

              // Merge: for each bill, keep it and insert previous version right after if available
              const merged = [];
              serviceData.forEach((b) => {
                merged.push(b);
                const pid = b.previousVersionId;
                if (pid && prevMap[pid] && !merged.find((x) => x._id === pid)) {
                  merged.push(prevMap[pid]);
                }
              });

              setServiceBills(merged);
            } else {
              setServiceBills(serviceData);
            }
          } catch (err) {
            // if previous-version fetch fails, just set primary list
            setServiceBills(serviceData);
          }

          const purchaseResponse = await axios.get(
            `${config.API_BASE_URL}/buy-letter`,
          );
          const purchaseRaw = purchaseResponse.data.data || purchaseResponse.data;
          setPurchaseHistory(Array.isArray(purchaseRaw) ? purchaseRaw : []);

          const sellResponse = await axios.get(
            `https://ok-motor-51l3.vercel.app/api/sell-letters`,
          );
          const sellRaw = sellResponse.data.data || sellResponse.data;
          setSellHistory(Array.isArray(sellRaw) ? sellRaw : []);
        } else {
          console.log(
            "Offline mode - loading service bills from local storage",
          );
          const offlineStorage = (await import("../services/offlineStorage"))
            .default;

          const serviceResult = await offlineStorage.find("serviceBills");
          if (serviceResult.success && serviceResult.data) {
            const sortedData = serviceResult.data.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );

            // include previous versions (offline): fetch by id and insert adjacent
            const merged = [];
            for (const b of sortedData) {
              merged.push(b);
              const pid = b.previousVersionId;
              if (pid) {
                try {
                  const found = await offlineStorage.findById(
                    "serviceBills",
                    pid,
                  );
                  if (
                    found.success &&
                    found.data &&
                    !merged.find((x) => x._id === pid)
                  ) {
                    const prev = found.data;
                    prev._isPreviousVersion = true;
                    merged.push(prev);
                  }
                } catch (err) {
                  // ignore missing previous
                }
              }
            }

            setServiceBills(merged);
          } else {
            setServiceBills([]);
          }

          const buyResult = await offlineStorage.find("buyLetters");
          if (buyResult.success && buyResult.data) {
            setPurchaseHistory(buyResult.data);
          } else {
            setPurchaseHistory([]);
          }

          const sellResult = await offlineStorage.find("sellLetters");
          if (sellResult.success && sellResult.data) {
            setSellHistory(sellResult.data);
          } else {
            setSellHistory([]);
          }

          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching data:", error);

        if (navigator.onLine) {
          console.log("Online fetch failed, trying offline fallback");
          try {
            const offlineStorage = (await import("../services/offlineStorage"))
              .default;

            const serviceResult = await offlineStorage.find("serviceBills");
            if (serviceResult.success && serviceResult.data) {
              const sortedData = serviceResult.data.sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
              );
              setServiceBills(sortedData);
            }

            const buyResult = await offlineStorage.find("buyLetters");
            if (buyResult.success) {
              setPurchaseHistory(buyResult.data || []);
            }

            const sellResult = await offlineStorage.find("sellLetters");
            if (sellResult.success) {
              setSellHistory(sellResult.data || []);
            }

            setTotalPages(1);
          } catch (offlineError) {
            console.error("Offline fallback also failed:", offlineError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 3) {
      setShowVehicleHistory(true);
    } else {
      setShowVehicleHistory(false);
    }
  };

  const getfilteredData = () => {
    if (!searchTerm) return { purchase: [], sell: [], service: [] };

    const lowerSearchTerm = searchTerm.toLowerCase();

    return {
      purchase: purchaseHistory.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm),
      ),
      sell: sellHistory.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm),
      ),
      service: serviceBills.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm),
      ),
    };
  };

  const filteredData = getfilteredData();

  const DownloadProgressModal = ({ progress, onClose }) => {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>Generating PDF</h2>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <div style={progressStyles.progressContainer}>
              <div
                style={{
                  ...progressStyles.progressBar,
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            <p style={progressStyles.progressText}>{progress}% Complete</p>
            {progress === 100 && (
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#088395",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "80%",
      maxWidth: "800px",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 24px",
      borderBottom: "1px solid #e2e8f0",
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: "600",
      margin: 0,
      color: "#1e293b",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#64748b",
      ":hover": {
        color: "#1e293b",
      },
    },
    form: {
      padding: "24px",
    },
    formSection: {
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e2e8f0",
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "16px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "16px",
    },
    formField: {
      marginBottom: "16px",
    },
    formLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#1e293b",
      marginBottom: "8px",
    },
    formInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "4px",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
      backgroundColor: "#f8fafc",
      ":focus": {
        outline: "none",
        borderColor: "#088395",
        boxShadow: "0 0 0 3px rgba(8, 131, 149, 0.1)",
        backgroundColor: "#ffffff",
      },
    },
    formActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "16px",
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #e2e8f0",
    },
    saveButton: {
      padding: "8px 16px",
      backgroundColor: "#088395",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      ":hover": {
        backgroundColor: "#2563eb",
      },
    },
    cancelButton: {
      padding: "8px 16px",
      backgroundColor: "#e2e8f0",
      color: "#1e293b",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      ":hover": {
        backgroundColor: "#cbd5e1",
      },
    },
  };

  const progressStyles = {
    progressContainer: {
      width: "100%",
      height: "20px",
      backgroundColor: "#e2e8f0",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "8px",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#088395",
      transition: "width 0.3s ease",
    },
    progressText: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
  };
  const testAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Testing authentication...");
      console.log("Token exists:", !!token);
      console.log(
        "Token preview:",
        token ? `${token.substring(0, 20)}...` : "No token",
      );

      const response = await axios.get(
        "https://ok-motor-51l3.vercel.app/api/auth/me",
      );
      console.log("Auth test successful:", response.data);
    } catch (error) {
      console.error("Auth test failed:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  const handleDownload = async (billId) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    await simulateProgress();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not authenticated. Please login again.");
        logout();
        navigate("/login");
        return;
      }

      await testAuth();
      const bill = serviceBills.find((b) => b._id === billId);

      if (!bill) {
        alert("Bill data not found. Please refresh.");
        return;
      }

      const result = await pdfService.generateServiceBillPDF(bill);

      if (result.success && result.blob) {
        if (!result.saved) {
          const url = window.URL.createObjectURL(result.blob);
          const link = document.createElement("a");
          link.href = url;
          const reg = bill.registrationNumber || bill._id || bill.billNumber;
          link.setAttribute("download", `OKM-SERVICE-${reg}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        throw new Error(result.error || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress((prev) => {
        const newState = { ...prev };
        delete newState[billId];
        return newState;
      });
    }
  };

  const handleViewBill = async (billId) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const bill = serviceBills.find((b) => b._id === billId);
      if (!bill) {
        alert("Bill data not found. Please refresh.");
        setIsDownloading(false);
        return;
      }

      const result = await pdfService.generateServiceBillPDF(bill, true);

      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);

        clearInterval(progressInterval);
        setDownloadProgress(100);
        setIsDownloading(false);

        setPreviewPdfUrl(url);
        setPreviewBill(bill);
        setShowPreviewModal(true);
      } else {
        throw new Error(result.error || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview. Please try again.");
      setIsDownloading(false);
    }
  };

  const getChanges = (current = {}, previous = {}) => {
    const changes = [];

    const simpleFields = [
      "customerName",
      "customerPhone",
      "customerAddress",
      "vehicleBrand",
      "vehicleModel",
      "registrationNumber",
      "kmReading",
      "grandTotal",
      "paymentStatus",
    ];

    simpleFields.forEach((f) => {
      const a = (current[f] || "") + "";
      const b = (previous[f] || "") + "";
      if (a !== b) {
        changes.push({ field: f, from: b, to: a });
      }
    });

    const curItems = Array.isArray(current.serviceItems)
      ? current.serviceItems
      : [];
    const prevItems = Array.isArray(previous.serviceItems)
      ? previous.serviceItems
      : [];
    if (curItems.length !== prevItems.length) {
      changes.push({
        field: "serviceItems",
        from: `${prevItems.length} items`,
        to: `${curItems.length} items`,
      });
    } else {
      for (let i = 0; i < Math.min(curItems.length, 5); i++) {
        const ci = curItems[i] || {};
        const pi = prevItems[i] || {};
        if (
          (ci.description || "") !== (pi.description || "") ||
          (ci.amount || 0) !== (pi.amount || 0)
        ) {
          changes.push({
            field: `serviceItems[${i}]`,
            from: `${pi.description || ""} (${pi.amount || 0})`,
            to: `${ci.description || ""} (${ci.amount || 0})`,
          });
        }
      }
    }

    ["issuesReported", "technicianNotes", "warrantyInfo"].forEach((f) => {
      const a = (current[f] || "") + "";
      const b = (previous[f] || "") + "";
      if (a !== b) changes.push({ field: f, from: b, to: a });
    });

    return changes;
  };

  const handleViewChanges = async (bill) => {
    try {
      if (!bill) return;
      const prevId = bill.previousVersionId || bill.originalDocumentId;
      if (!prevId) {
        alert("No previous version available to compare");
        return;
      }

      setIsComputingChanges(true);
      let previous;
      if (!navigator.onLine) {
        const offlineStorage = (await import("../services/offlineStorage"))
          .default;
        const found = await offlineStorage.findById("serviceBills", prevId);
        previous = found.success ? found.data : null;
      } else {
        const token = localStorage.getItem("token");
        const resp = await axios.get(
          `https://ok-motor-51l3.vercel.app/api/service-bills/${prevId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        previous = resp.data.data || resp.data;
      }

      if (!previous) {
        alert("Previous version not found");
        setIsComputingChanges(false);
        return;
      }

      const changes = getChanges(bill, previous);
      setChangesList(changes);
      setChangesTargetBill({ current: bill, previous });
      setShowChangesModal(true);
    } catch (error) {
      console.error("Error fetching previous version:", error);
      alert("Failed to fetch previous version");
    } finally {
      setIsComputingChanges(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    const id = confirmTargetId;
    try {
      await axios.delete(
        `https://ok-motor-51l3.vercel.app/api/service-bills/${id}`,
      );
      setServiceBills((prev) => prev.filter((bill) => bill._id !== id));
    } catch (error) {
      console.error("Error deleting service bill:", error);
      alert("Failed to delete service bill");
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEdit = (bill) => {
    navigate("/service/create", { state: { bill } });
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: (userRole) => (userRole === "admin" ? "/admin" : "/staff"),
    },
    {
      name: "Vehicle",
      icon: ShipWheel,
      submenu: [
        { name: "Add Vehicle", path: "/vehicle/create" },
        { name: "Vehicle List", path: "/vehicle/history" },
      ],
    },
    {
      name: "Buy",
      icon: ShoppingCart,
      submenu: [
        { name: "Create Buy Letter", path: "/buy/create" },
        { name: "Buy Letter History", path: "/buy/history" },
      ],
    },
    {
      name: "Sell",
      icon: TrendingUp,
      submenu: [
        { name: "Create Sell Letter", path: "/sell/create" },
        { name: "Sell Letter History", path: "/sell/history" },
        { name: "Sell Requests", path: "/sell/requests" },
      ],
    },
    {
      name: "Updates",
      icon: RefreshCw,
      submenu: [
        { name: "Create Update", path: "/updates/create" },
        { name: "Updates List", path: "/updates" },
      ],
    },
    {
      name: "Announcements",
      icon: Megaphone,
      path: "/announcements",
    },
    {
      name: "Service",
      icon: Wrench,
      submenu: [
        { name: "Create Service Bill", path: "/service/create" },
        { name: "Service History", path: "/service/history" },
      ],
    },
    {
      name: "Payment",
      icon: FileText,
      submenu: [
        { name: "Create Advance Bill", path: "/advance/create" },
        { name: "Advance History", path: "/advance/history" },
      ],
    },
    {
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Gallery",
      icon: Image,
      path: "/gallery/manage",
    },
    {
      name: "Vehicle History",
      icon: Bike,
      path: "/bike-history",
    },
    {
      name: "Letter Head",
      icon: FileText,
      path: "/letter-head/create",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Service Bill"
        message="Are you sure you want to delete this service bill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
        }}
      />
      <div
        style={{
          ...styles.topBar,
          display: isMobile && !isSidebarOpen ? "block" : "none",
        }}
      >
        <div
          style={{
            ...styles.hamburgerMenu,
            display: isMobile && !isSidebarOpen ? "block" : "none",
          }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {}
      <div
        style={{
          ...styles.sidebar,
          ...(isMobile
            ? {
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
                position: "fixed",
                zIndex: 15,
              }
            : {}),
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={logo}
            alt="logo"
            style={{
              width: "100%",
              maxWidth: "25rem",
              height: "9rem",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              margin: "0 auto 1rem auto",
            }}
          />
          <p className="sidebar-subtitle">Welcome, {user?.name || "User"}</p>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                style={{
                  ...styles.menuItem,
                  backgroundColor: "#071952",
                  color: "#ffffff",
                }}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.name);
                  } else {
                    handleMenuClick(item.name, item.path);
                  }
                }}
              >
                <div style={styles.menuItemContent}>
                  <item.icon size={20} style={styles.menuIcon} />
                  <span style={styles.menuText}>{item.name}</span>
                </div>
                {item.submenu &&
                  (expandedMenus[item.name] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  ))}
              </div>

              {item.submenu && (
                <div
                  style={{
                    ...styles.submenu,
                    maxHeight: expandedMenus[item.name]
                      ? `${item.submenu.length * 48}px`
                      : "0px",
                    opacity: expandedMenus[item.name] ? 1 : 0,
                    transition:
                      "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
                    overflow: "hidden",
                  }}
                >
                  {item.submenu.map((subItem) => (
                    <div
                      key={subItem.name}
                      style={{
                        ...styles.submenuItem,
                        ...(activeMenu === subItem.name
                          ? styles.submenuItemActive
                          : {}),
                      }}
                      onClick={() =>
                        handleMenuClick(subItem.name, subItem.path)
                      }
                    >
                      {subItem.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      {}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Service History</h1>
            <p style={styles.pageSubtitle}>
              {showVehicleHistory
                ? `Showing history for vehicle: ${searchTerm}`
                : "View and manage all your service bills"}
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by registration number..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading data...</p>
            </div>
          ) : showVehicleHistory ? (
            <>
              {}
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Purchase History
                </h3>
                {filteredData.purchase.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Seller</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Purchase Date</th>
                          <th style={styles.tableHeader}>Amount</th>
                          <th style={styles.tableHeader}>Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.purchase.map((item) => (
                          <tr key={item._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{item.sellerName}</td>
                            <td style={styles.tableCell}>
                              {item.vehicleBrand} {item.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>
                              {item.registrationNumber}
                            </td>
                            <td style={styles.tableCell}>
                              {new Date(item.purchaseDate).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{item.purchaseAmount?.toFixed(2) || 0}
                            </td>
                            <td style={styles.tableCell}>
                              {item.user && item.user.role === "admin"
                                ? "admin"
                                : item.user && item.user.name
                                  ? item.user.name
                                  : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>No purchase records found</p>
                )}
              </div>

              {}
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Sell History
                </h3>
                {filteredData.sell.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Buyer</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Sell Date</th>
                          <th style={styles.tableHeader}>Amount</th>
                          <th style={styles.tableHeader}>Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.sell.map((item) => (
                          <tr key={item._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{item.buyerName}</td>
                            <td style={styles.tableCell}>
                              {item.vehicleBrand} {item.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>
                              {item.registrationNumber}
                            </td>
                            <td style={styles.tableCell}>
                              {new Date(item.sellDate).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{item.sellAmount?.toFixed(2) || 0}
                            </td>
                            <td style={styles.tableCell}>
                              {item.user && item.user.role === "admin"
                                ? "admin"
                                : item.user && item.user.name
                                  ? item.user.name
                                  : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>No sell records found</p>
                )}
              </div>

              {}
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Service History
                </h3>
                {filteredData.service.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Customer</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Amount</th>
                          <th style={styles.tableHeader}>Date</th>
                          <th style={styles.tableHeader}>Created By</th>
                          <th style={styles.tableHeader}>Status</th>
                          <th style={styles.tableHeader}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.service.map((bill) => (
                          <tr key={bill._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>
                              {bill.customerName}
                            </td>
                            <td style={styles.tableCell}>
                              {bill.vehicleBrand} {bill.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>
                              {bill.registrationNumber}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{bill.grandTotal?.toFixed(2) || 0}
                            </td>
                            <td style={styles.tableCell}>
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              {bill.user && bill.user.role === "admin"
                                ? "admin"
                                : bill.user && bill.user.name
                                  ? bill.user.name
                                  : ""}
                            </td>
                            <td style={styles.tableCell}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  ...(bill.paymentStatus === "paid"
                                    ? styles.statusPaid
                                    : bill.paymentStatus === "partial"
                                      ? styles.statusPartial
                                      : styles.statusPending),
                                }}
                              >
                                {bill.paymentStatus}
                              </span>
                            </td>
                            <td style={styles.tableCell}>
                              <button
                                onClick={() => handleDownload(bill._id)}
                                style={styles.iconButton}
                                title="Download"
                                disabled={
                                  downloadProgress[bill._id] !== undefined
                                }
                              >
                                {downloadProgress[bill._id] !== undefined ? (
                                  <div
                                    style={{
                                      width: "60px",
                                      height: "4px",
                                      backgroundColor: "#e2e8f0",
                                      borderRadius: "2px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${downloadProgress[bill._id]}%`,
                                        height: "100%",
                                        backgroundColor: "#088395",
                                        transition: "width 0.3s ease",
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <Download size={16} />
                                )}
                              </button>
                              {user?.role === "admin" && (
                                <>
                                  <button
                                    onClick={() => handleEdit(bill)}
                                    style={styles.iconButton}
                                    title="Edit"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(bill._id)}
                                    style={styles.iconButton}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>No service records found</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Customer</th>
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Reg No.</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Created By</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceBills.map((bill) => (
                      <tr
                        key={bill._id}
                        style={{
                          ...styles.tableRow,
                          ...(bill._isPreviousVersion
                            ? styles.previousRow
                            : {}),
                        }}
                      >
                        <td style={styles.tableCell}>{bill.customerName}</td>
                        <td style={styles.tableCell}>
                          {`${bill.vehicleBrand} ${bill.vehicleModel}`
                            .split("\n")[0]
                            .substring(0, 20)}
                          {`${bill.vehicleBrand} ${bill.vehicleModel}`.length >
                            20 && "..."}
                        </td>
                        <td style={styles.tableCell}>
                          {bill.registrationNumber}
                          {bill._isPreviousVersion ? (
                            <span
                              style={{
                                marginLeft: 8,
                                padding: "2px 6px",
                                backgroundColor: "#e2e8f0",
                                color: "#475569",
                                borderRadius: 6,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                              title="Previous version"
                            >
                              Previous
                            </span>
                          ) : (
                            bill.previousVersionId && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  padding: "2px 6px",
                                  backgroundColor: "#fde68a",
                                  color: "#92400e",
                                  borderRadius: 6,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                                title="This is a newer version"
                              >
                                Updated
                              </span>
                            )
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          ₹
                          {new Intl.NumberFormat("en-IN").format(
                            bill.grandTotal,
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {formatDate(bill.createdAt)}
                        </td>

                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(bill.paymentStatus === "paid"
                                ? styles.statusPaid
                                : bill.paymentStatus === "partial"
                                  ? styles.statusPartial
                                  : styles.statusPending),
                            }}
                          >
                            {bill.paymentStatus}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {bill.user && bill.user.role === "admin"
                            ? "admin"
                            : bill.user && bill.user.name
                              ? bill.user.name
                              : ""}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleViewBill(bill._id)}
                            style={styles.iconButton}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(bill._id)}
                            style={styles.iconButton}
                            title="Download"
                            disabled={downloadProgress[bill._id] !== undefined}
                          >
                            {downloadProgress[bill._id] !== undefined ? (
                              <div
                                style={{
                                  width: "60px",
                                  height: "4px",
                                  backgroundColor: "#e2e8f0",
                                  borderRadius: "2px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${downloadProgress[bill._id]}%`,
                                    height: "100%",
                                    backgroundColor: "#088395",
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                          {user?.role === "admin" &&
                            !bill._isPreviousVersion && (
                              <>
                                <button
                                  onClick={() => handleEdit(bill)}
                                  style={styles.iconButton}
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(bill._id)}
                                  style={styles.iconButton}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}

                          {/* View changes button - for newer versions or to compare newer vs previous */}
                          {bill._isPreviousVersion
                            ? (() => {
                                const newer = serviceBills.find(
                                  (s) => s.previousVersionId === bill._id,
                                );
                                return newer ? (
                                  <button
                                    onClick={() => handleViewChanges(newer)}
                                    style={styles.iconButton}
                                    title="View Changes (newer)"
                                    disabled={isComputingChanges}
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                ) : null;
                              })()
                            : bill.previousVersionId && (
                                <button
                                  onClick={() => handleViewChanges(bill)}
                                  style={styles.iconButton}
                                  title="View Changes"
                                  disabled={isComputingChanges}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.pagination}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {isDownloading && (
        <DownloadProgressModal
          progress={downloadProgress}
          onClose={() => setIsDownloading(false)}
        />
      )}
      {Object.entries(downloadProgress).map(([billId, progress]) => (
        <div key={billId} style={styles.downloadProgressContainer}>
          <div
            style={{ ...styles.downloadProgressBar, width: `${progress}%` }}
          />
        </div>
      ))}
      {showPreviewModal && previewBill && previewPdfUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            setShowPreviewModal(false);
            if (previewPdfUrl) {
              URL.revokeObjectURL(previewPdfUrl);
              setPreviewPdfUrl(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={24} color="#088395" />
                Service Bill Preview
              </h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                backgroundColor: "#525659",
              }}
            >
              {isMobile ? (
                <PdfPreview pdfUrl={previewPdfUrl} />
              ) : (
                <object
                  data={previewPdfUrl}
                  type="application/pdf"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                  aria-label="Service Bill PDF Preview"
                >
                  <iframe
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="Service Bill PDF Preview"
                  />
                </object>
              )}
            </div>
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#f8fafc",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showChangesModal && changesTargetBill && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 20,
          }}
          onClick={() => setShowChangesModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(900px, 96%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(2,6,23,0.2)",
            }}
          >
            <div
              style={{
                padding: 18,
                borderBottom: "1px solid #e6edf3",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{ margin: 0 }}
              >{`Changes — ${changesTargetBill.current.billNumber || changesTargetBill.current._id}`}</h3>
              <button
                onClick={() => setShowChangesModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                <X />
              </button>
            </div>
            <div style={{ padding: 18 }}>
              {changesList.length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  No changes detected compared to previous version.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {changesList.map((c, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <strong style={{ display: "block", color: "#0f172a" }}>
                        {c.field}
                      </strong>
                      <div style={{ color: "#475569" }}>
                        From: {c.from || <em>empty</em>}
                      </div>
                      <div style={{ color: "#0f172a", marginTop: 6 }}>
                        To: {c.to || <em>empty</em>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div
              style={{
                padding: 18,
                borderTop: "1px solid #e6edf3",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowChangesModal(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#EBF4F6",
    fontFamily: "'Inter', sans-serif",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    padding: "1rem",
    background: "#ffffff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 20,
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
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
  sidebarTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#ffffff",
    margin: 0,
  },
  sidebarSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: "4px 0 0 0",
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
    ":hover": {
      backgroundColor: "#1e293b",
    },
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
  downloadProgressContainer: {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    height: "4px",
    backgroundColor: "#e2e8f0",
    zIndex: 1000,
  },
  downloadProgressBar: {
    height: "100%",
    backgroundColor: "#088395",
    transition: "width 0.3s ease",
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
    ":hover": {
      backgroundColor: "#2d3748",
    },
  },
  submenuItemActive: {
    backgroundColor: "#2d3748",
    color: "#ffffff",
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
    ":hover": {
      backgroundColor: "#7f1d1d20",
    },
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "#ffffff",
  },
  contentPadding: {
    padding: "32px",
  },
  header: {
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: "8px 0 0 0",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  searchInputContainer: {
    position: "relative",
    width: "300px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    ":focus": {
      outline: "none",
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(8, 131, 149, 0.1)",
    },
  },
  newBillButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#088395",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#EBF4F6",
    color: "#1e293b",
    fontSize: "0.875rem",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    ":hover": {
      backgroundColor: "#f8fafc",
    },
  },
  tableCell: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "#1e293b",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  statusPaid: {
    backgroundColor: "rgba(8, 131, 149, 0.1)",
    color: "#088395",
  },
  statusPartial: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  statusPending: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "8px",
    margin: "0 4px",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "#EBF4F6",
      color: "#088395",
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#e2e8f0",
    color: "#1e293b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#cbd5e1",
    },
    ":disabled": {
      opacity: "0.5",
      cursor: "not-allowed",
    },
  },
  pageInfo: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    color: "#64748b",
  },
  previousRow: {
    backgroundColor: "#fbfdfe",
    color: "#64748b",
    fontStyle: "italic",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },
  emptyIcon: {
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  emptyText: {
    color: "#64748b",
    fontSize: "1rem",
    margin: 0,
  },
};

export default ServiceHistory;
