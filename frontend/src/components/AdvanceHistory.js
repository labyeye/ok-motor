import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import pdfService from "../services/pdfService";
import { FileText, Search, Download, Trash2, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import TableFilter from "./common/TableFilter";
import ConfirmModal from "./ConfirmModal";
import PdfPreview from "./PdfPreview";
import AlertModal from "./common/AlertModal";

const AdvanceHistory = () => {
  const { user, logout } = useContext(AuthContext);
  const [advanceBills, setAdvanceBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    total: null,
    advance: null,
    balance: null,
    date: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const navigate = useNavigate();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewBill, setPreviewBill] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/advance-bills?page=${currentPage}`,
          { headers: {} },
        );
        setAdvanceBills(response.data.data || []);
      } catch (error) {
        console.error("Error fetching advance bills:", error);
        setAdvanceBills([]);
      }
      setLoading(false);
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
    setSearchTerm(e.target.value);
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

  const filteredBills = (advanceBills || []).filter((bill) => {
    const q = String(searchTerm || "").toLowerCase();
    const matchesSearch =
      !q ||
      (bill.registrationNumber || "").toLowerCase().includes(q) ||
      (bill.customerName || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const toFilter = filters.total;
    if (toFilter && toFilter.op) {
      const val = Number(bill.grandTotal || bill.total || 0);
      if (isNaN(val)) return false;
      const v = Number(toFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (toFilter.op !== "between" && isNaN(v)) return false;
      if (toFilter.op === "eq" && val !== v) return false;
      if (toFilter.op === "gt" && val <= v) return false;
      if (toFilter.op === "lt" && val >= v) return false;
      if (toFilter.op === "between") {
        const v2 = Number(toFilter.value2);
        const hasV1 = !isNaN(v);
        const hasV2 = !isNaN(v2);
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = Math.min(v, v2);
          const max = Math.max(v, v2);
          if (val < min || val > max) return false;
        } else if (hasV1) {
          if (val < v) return false;
        } else if (hasV2) {
          if (val > v2) return false;
        }
      }
    }

    const advFilter = filters.advance;
    if (advFilter && advFilter.op) {
      const val = Number(bill.advancePaid || 0);
      if (isNaN(val)) return false;
      const v = Number(advFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (advFilter.op !== "between" && isNaN(v)) return false;
      if (advFilter.op === "eq" && val !== v) return false;
      if (advFilter.op === "gt" && val <= v) return false;
      if (advFilter.op === "lt" && val >= v) return false;
      if (advFilter.op === "between") {
        const v2 = Number(advFilter.value2);
        const hasV1 = !isNaN(v);
        const hasV2 = !isNaN(v2);
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = Math.min(v, v2);
          const max = Math.max(v, v2);
          if (val < min || val > max) return false;
        } else if (hasV1) {
          if (val < v) return false;
        } else if (hasV2) {
          if (val > v2) return false;
        }
      }
    }

    const balFilter = filters.balance;
    if (balFilter && balFilter.op) {
      const val = Number(bill.balanceDue || 0);
      if (isNaN(val)) return false;
      const v = Number(balFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (balFilter.op !== "between" && isNaN(v)) return false;
      if (balFilter.op === "eq" && val !== v) return false;
      if (balFilter.op === "gt" && val <= v) return false;
      if (balFilter.op === "lt" && val >= v) return false;
      if (balFilter.op === "between") {
        const v2 = Number(balFilter.value2);
        const hasV1 = !isNaN(v);
        const hasV2 = !isNaN(v2);
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = Math.min(v, v2);
          const max = Math.max(v, v2);
          if (val < min || val > max) return false;
        } else if (hasV1) {
          if (val < v) return false;
        } else if (hasV2) {
          if (val > v2) return false;
        }
      }
    }

    const dFilter = filters.date;
    if (dFilter && dFilter.op) {
      const dStr = bill.createdAt || bill.date || null;
      if (!dStr) return false;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return false;
      const v = new Date(dFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (dFilter.op !== "between" && isNaN(v.getTime())) return false;
      if (dFilter.op === "eq" && d.toDateString() !== v.toDateString())
        return false;
      if (dFilter.op === "before" && !(d < v)) return false;
      if (dFilter.op === "after" && !(d > v)) return false;
      if (dFilter.op === "between") {
        const v2 = new Date(dFilter.value2);
        const hasV1 = !isNaN(v.getTime());
        const hasV2 = !isNaN(v2.getTime());
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = v < v2 ? v : v2;
          const max = v > v2 ? v : v2;
          if (d < min || d > max) return false;
        } else if (hasV1) {
          if (d < v) return false;
        } else if (hasV2) {
          if (d > v2) return false;
        }
      }
    }

    return true;
  });

  const handleDownload = async (billId) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      const token = localStorage.getItem("token");
      if (!token) {
        setAlertInfo({
          isOpen: true,
          message: "You are not authenticated. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
        return;
      }
      await simulateProgress();

      const bill = advanceBills.find((b) => b._id === billId);
      if (!bill) {
        setAlertInfo({
          isOpen: true,
          message: "Advance bill not found. Please refresh.",
          type: "error",
        });
        return;
      }

      // Generate PDF client-side (offline/online) using pdfService
      const result = await pdfService.generateAdvanceBillPDF(bill);
      if (result.success && result.blob) {
        // If the PDF was already saved by fileSaveService (electron or browser fallback), skip creating another download link
        if (!result.saved) {
          const url = window.URL.createObjectURL(result.blob);
          const link = document.createElement("a");
          link.href = url;
          const reg = bill.registrationNumber || bill.billNumber || bill._id;
          link.setAttribute("download", `OKM-ADVANCE-${reg}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      } else {
        throw new Error(result.error || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (error.response?.status === 401) {
        setAlertInfo({
          isOpen: true,
          message: "Your session has expired. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
      } else if (error.response?.status === 403) {
        setAlertInfo({
          isOpen: true,
          message: "You don't have permission to download this file.",
          type: "error",
        });
      } else if (error.response?.status === 404) {
        setAlertInfo({
          isOpen: true,
          message:
            "Advance bill not found or PDF could not be generated. Please try again or contact support.",
          type: "error",
        });
      } else if (error.response?.status === 503) {
        setAlertInfo({
          isOpen: true,
          message:
            "Server is temporarily unavailable. Please try again in a few minutes.",
          type: "error",
        });
      } else if (
        error.response?.status === 502 ||
        error.response?.status === 504
      ) {
        setAlertInfo({
          isOpen: true,
          message: "Server is experiencing issues. Please try again later.",
          type: "error",
        });
      } else if (error.code === "ERR_NETWORK" || error.code === "ERR_FAILED") {
        setAlertInfo({
          isOpen: true,
          message:
            "Network error. This might be due to:\n• Server is temporarily down\n• Service worker interference\n• Network connectivity issues\n\nPlease try again in a few minutes.",
          type: "error",
        });
      } else if (error.code === "ECONNABORTED") {
        setAlertInfo({
          isOpen: true,
          message:
            "Connection timeout. Please check your internet connection and try again.",
          type: "error",
        });
      } else {
        setAlertInfo({
          isOpen: true,
          message: `Failed to download PDF: ${
            error.response?.data?.message ||
            error.message ||
            "Server temporarily unavailable"
          }`,
          type: "error",
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewBill = async (billId) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const token = localStorage.getItem("token");
      if (!token) {
        setAlertInfo({
          isOpen: true,
          message: "You are not authenticated. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
        setIsDownloading(false);
        return;
      }

      const bill = advanceBills.find((b) => b._id === billId);
      if (!bill) {
        setAlertInfo({
          isOpen: true,
          message: "Advance bill not found. Please refresh.",
          type: "error",
        });
        clearInterval(progressInterval);
        setIsDownloading(false);
        return;
      }

      // Generate PDF client-side (offline/online) using pdfService (previewOnly=true)
      const result = await pdfService.generateAdvanceBillPDF(bill, true);

      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);

        clearInterval(progressInterval);
        setDownloadProgress(100);
        setIsDownloading(false);

        setPreviewPdfUrl(url);
        setPreviewBill(bill);
        setShowPreviewModal(true);
      } else {
        throw new Error(result.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      setAlertInfo({
        isOpen: true,
        message: "Failed to generate preview. Please try again.",
        type: "error",
      });
      setIsDownloading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    const id = confirmTargetId;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAlertInfo({
          isOpen: true,
          message: "You are not authenticated. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
        return;
      }

      await axios.delete(
        `https://ok-motor-backend.vercel.app/api/advance-bills/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAdvanceBills((prev) => prev.filter((bill) => bill._id !== id));
    } catch (error) {
      console.error("Error deleting advance bill:", error);
      if (error.response?.status === 401) {
        setAlertInfo({
          isOpen: true,
          message: "Your session has expired. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
      } else if (error.response?.status === 403) {
        setAlertInfo({
          isOpen: true,
          message: "You don't have permission to delete this file.",
          type: "error",
        });
      } else {
        setAlertInfo({
          isOpen: true,
          message: `Failed to delete: ${
            error.response?.data?.message || error.message || "Unknown error"
          }`,
          type: "error",
        });
      }
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        title="Delete Advance Bill"
        message="Are you sure you want to delete this advance bill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
        }}
      />
      <AppSidebar user={user} onLogout={handleLogout} />
      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })}
        message={alertInfo.message}
        type={alertInfo.type}
      />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Advance History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all your advance bills
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by registration number or customer name..."
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
          ) : (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Customer</th>
                        <th style={styles.tableHeader}>Vehicle</th>
                        <th style={styles.tableHeader}>Reg No.</th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Total Amount</span>
                            <TableFilter
                              type="number"
                              placeholder="₹"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, total: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, total: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Advance Paid</span>
                            <TableFilter
                              type="number"
                              placeholder="₹"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, advance: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, advance: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Balance Due</span>
                            <TableFilter
                              type="number"
                              placeholder="₹"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, balance: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, balance: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Date</span>
                            <TableFilter
                              type="date"
                              placeholder="yyyy-mm-dd"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, date: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, date: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>Created By</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill) => (
                        <tr key={bill._id} style={styles.tableRow}>
                          <td style={styles.tableCell}>{bill.customerName}</td>
                          <td style={styles.tableCell}>
                            {bill.vehicleBrand} {bill.vehicleModel}
                          </td>
                          <td style={styles.tableCell}>
                            {bill.registrationNumber}
                          </td>
                          <td style={styles.tableCell}>
                            ₹
                            {new Intl.NumberFormat("en-IN").format(
                              bill.grandTotal,
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            ₹
                            {new Intl.NumberFormat("en-IN").format(
                              bill.advancePaid,
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            ₹
                            {new Intl.NumberFormat("en-IN").format(
                              bill.balanceDue,
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            {formatDate(bill.createdAt)}
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
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            {user?.role === "admin" && (
                              <button
                                onClick={() => handleDelete(bill._id)}
                                style={styles.iconButton}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {filteredBills.map((bill) => (
                    <div
                      key={bill._id}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#071952",
                          padding: "12px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                          }}
                        >
                          {bill.registrationNumber || "—"}
                        </span>
                        <span
                          style={{
                            backgroundColor: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            borderRadius: "20px",
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                          }}
                        >
                          {formatDate(bill.createdAt)}
                        </span>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.82rem",
                            color: "#64748b",
                          }}
                        >
                          {bill.vehicleBrand} {bill.vehicleModel}
                        </p>
                        {[
                          ["Customer", bill.customerName],
                          [
                            "Total",
                            `₹${new Intl.NumberFormat("en-IN").format(bill.grandTotal)}`,
                          ],
                          [
                            "Advance",
                            `₹${new Intl.NumberFormat("en-IN").format(bill.advancePaid)}`,
                          ],
                          [
                            "Balance",
                            `₹${new Intl.NumberFormat("en-IN").format(bill.balanceDue)}`,
                          ],
                          [
                            "Created By",
                            bill.user?.role === "admin"
                              ? "admin"
                              : bill.user?.name || "",
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "4px 0",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "#94a3b8",
                                fontWeight: "500",
                              }}
                            >
                              {label}
                            </span>
                            <span
                              style={{
                                fontSize: "0.82rem",
                                color: "#1e293b",
                                fontWeight: "600",
                                textAlign: "right",
                                maxWidth: "60%",
                              }}
                            >
                              {value || "—"}
                            </span>
                          </div>
                        ))}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            onClick={() => handleViewBill(bill._id)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              backgroundColor: "#e0f2fe",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#0284c7",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => handleDownload(bill._id)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              backgroundColor: "#f1f5f9",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#334155",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                          >
                            <Download size={14} /> PDF
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(bill._id)}
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: "#fee2e2",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                color: "#991b1b",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
              maxWidth: "960px",
              width: "100%",
              height: "90vh",
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
                Advance Bill Preview
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
                overflow: "auto",
                backgroundColor: "#525659",
                minHeight: 0,
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
                    minHeight: "500px",
                    border: "none",
                    display: "block",
                  }}
                  aria-label="Advance Bill PDF Preview"
                >
                  <iframe
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "500px",
                      border: "none",
                      display: "block",
                    }}
                    title="Advance Bill PDF Preview"
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

export default AdvanceHistory;
