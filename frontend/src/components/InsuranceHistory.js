import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { Shield, Trash2, Edit, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import TableFilter from "./common/TableFilter";

const InsuranceHistory = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: null,
    expiry: null,
    expiryTone: "all",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchHistory();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const API_BASE_URL = "https://ok-motor-51l3.vercel.app/api";

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/insurance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching insurance history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    navigate("/insurance/create", { state: { insuranceData: item } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/insurance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHistory();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
      padding: "10px 12px 10px 40px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
      backgroundColor: "#f8fafc",
    },
    newLetterButton: {
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
      backgroundColor: "#f1f5f9",
      color: "#1e293b",
      fontSize: "0.875rem",
      fontWeight: "600",
      borderBottom: "1px solid #e2e8f0",
    },
    tableCell: {
      padding: "12px 16px",
      fontSize: "0.875rem",
      color: "#000000ff",
    },
    iconButton: {
      background: "none",
      border: "none",
      color: "#64748b",
      cursor: "pointer",
      padding: "8px",
      margin: "0 4px",
      borderRadius: "4px",
    },
    headerStatusFilter: {
      border: "1px solid #cbd5e1",
      borderRadius: "6px",
      fontSize: "0.75rem",
      padding: "4px 8px",
      backgroundColor: "#ffffff",
      color: "#1e293b",
      minWidth: "150px",
    },
    expiryBadge: {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "999px",
      fontWeight: 600,
      fontSize: "0.875rem",
      lineHeight: 1.2,
      whiteSpace: "nowrap",
    },
    expiryBadgeExpired: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    expiryBadgeMissing: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
    },
    expiryBadgeSoon: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    expiryBadgeHealthy: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
  };

  const getExpiryMeta = (rawDate) => {
    if (!rawDate) return { text: "—", tone: "missing" };

    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return { text: "—", tone: "missing" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(parsed);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return { text: parsed.toLocaleDateString("en-IN"), tone: "expired" };
    }
    if (diffDays <= 7) {
      return { text: parsed.toLocaleDateString("en-IN"), tone: "soon" };
    }
    return { text: parsed.toLocaleDateString("en-IN"), tone: "healthy" };
  };

  const filteredHistory = (history || []).filter((item) => {
    const q = String(searchTerm || "").toLowerCase();
    const matchesSearch =
      !q ||
      (item.regNo || "").toLowerCase().includes(q) ||
      (item.personName || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;



    // Expiry date filter
    const eFilter = filters.expiry;
    if (eFilter && eFilter.op) {
      const dStr = item.insuranceExpiry || item.insuranceExpiryDate;
      if (!dStr) return false;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return false;
      const v = new Date(eFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (eFilter.op !== "between" && isNaN(v.getTime())) return false;
      if (eFilter.op === "eq" && d.toDateString() !== v.toDateString())
        return false;
      if (eFilter.op === "before" && !(d < v)) return false;
      if (eFilter.op === "after" && !(d > v)) return false;
      if (eFilter.op === "between") {
        const v2 = new Date(eFilter.value2);
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

    const toneFilter = filters.expiryTone || "all";
    if (toneFilter !== "all") {
      const tone = getExpiryMeta(
        item.insuranceExpiry || item.insuranceExpiryDate,
      ).tone;
      if (tone !== toneFilter) return false;
    }

    return true;
  });

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "60px" : "0",
      }}
    >
      {}
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {}
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Insurance History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all insurance records.
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or reg number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button
              style={styles.newLetterButton}
              onClick={() => navigate("/insurance/create")}
            >
              <Shield size={16} />
              New Insurance
            </button>
          </div>

          <div style={styles.tableContainer}>
            {loading ? (
              <p>Loading...</p>
            ) : filteredHistory.length === 0 ? (
              <p>
                {searchTerm
                  ? `No records found for "${searchTerm}"`
                  : "No insurance records found."}
              </p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Person Name</th>
                    <th style={styles.tableHeader}>Phone</th>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Vehicle</th>
                    <th style={styles.tableHeader}>Reg No</th>
                    <th style={styles.tableHeader}>Policy No</th>
                    <th style={styles.tableHeader}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span>Company</span>
                        
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
                        <span>Expiry Date</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={filters.expiryTone || "all"}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                expiryTone: e.target.value,
                              }))
                            }
                            style={styles.headerStatusFilter}
                            title="Filter by expiry color status"
                          >
                            <option value="all">All Colors</option>
                            <option value="expired">🔴 Expired</option>
                            <option value="missing">🔵 Not Entered</option>
                            <option value="soon">🟡 0-7 Days</option>
                            <option value="healthy">🟢 8+ Days</option>
                          </select>
                          <TableFilter
                            type="date"
                            placeholder="yyyy-mm-dd"
                            rangeOnly={true}
                            onApply={(f) =>
                              setFilters((p) => ({ ...p, expiry: f }))
                            }
                            onClear={() =>
                              setFilters((p) => ({ ...p, expiry: null }))
                            }
                          />
                        </div>
                      </div>
                    </th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item._id}>
                      <td style={styles.tableCell}>{item.personName}</td>
                      <td style={styles.tableCell}>{item.personPhone}</td>
                      <td style={styles.tableCell}>
                        {item.personEmail || item.email || ""}
                      </td>
                      <td style={styles.tableCell}>
                        {item.brand} {item.vehicleModel} ({item.year})
                      </td>
                      <td style={styles.tableCell}>{item.regNo}</td>
                      <td style={styles.tableCell}>{item.insurancePolicyNo}</td>
                      <td style={styles.tableCell}>{item.insuranceCompany}</td>
                      <td style={styles.tableCell}>
                        {(() => {
                          const meta = getExpiryMeta(
                            item.insuranceExpiry || item.insuranceExpiryDate,
                          );
                          const toneStyle =
                            meta.tone === "expired"
                              ? styles.expiryBadgeExpired
                              : meta.tone === "missing"
                                ? styles.expiryBadgeMissing
                                : meta.tone === "soon"
                                  ? styles.expiryBadgeSoon
                                  : styles.expiryBadgeHealthy;
                          return (
                            <span style={{ ...styles.expiryBadge, ...toneStyle }}>
                              {meta.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={styles.iconButton}
                            onClick={() => handleEdit(item)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            style={styles.iconButton}
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceHistory;
