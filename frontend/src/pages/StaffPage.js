import { useState, useEffect, useContext, useCallback } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AuthContext from "../context/AuthContext";
import AppSidebar from "../components/common/AppSidebar";

const StaffPage = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [dashboardData, setDashboardData] = useState({
    totalBuyLetters: 0,
    totalSellLetters: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    profit: 0,
    ownerName: user.name,
  });
  const [loading, setLoading] = useState(true);
  const [isOwnerView, setIsOwnerView] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isOwnerView
        ? `http://ok-motor-backend.vercel.app/api/dashboard/owner`
        : `http://ok-motor-backend.vercel.app/api/dashboard/stats`;

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback data if API fails
      // setDashboardData({
      //   totalBuyLetters: 145,
      //   totalSellLetters: 128,
      //   totalBuyValue: 2450000,
      //   totalSellValue: 2890000,
      //   profit: 440000,
      //   ownerName: user.name,
      // });
    } finally {
      setLoading(false);
    }
  }, [isOwnerView]);

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      fetchDashboardData();
    }
  }, [activeMenu, isOwnerView, fetchDashboardData]);

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleOwnerView = () => {
    setIsOwnerView(!isOwnerView);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  // In the menuItems array (around line 250 in BuyLetterPDF.js)

  const DashboardCards = () => (
    <div style={styles.cardsGrid}>
      {loading ? (
        Array(4)
          .fill()
          .map((_, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                borderLeft: `4px solid ${
                  ["#088395", "#37B7C3", "#071952", "#f59e0b"][index]
                }`,
                opacity: 0.7,
              }}
            >
              <div style={styles.cardContent}>
                <div>
                  <p style={styles.cardLabel}>Loading...</p>
                  <p style={styles.cardValue}>-</p>
                </div>
                <div
                  style={{
                    ...styles.cardIcon,
                    backgroundColor: [
                      "rgba(8, 131, 149, 0.15)",
                      "rgba(55, 183, 195, 0.15)",
                      "rgba(7, 25, 82, 0.15)",
                      "#fef3c7",
                    ][index],
                  }}
                >
                  {
                    [
                      <FileText size={32} color="#2563eb" />,
                      <TrendingUp size={32} color="#059669" />,
                      <Wrench size={32} color="#7c3aed" />,
                      <FileText size={32} color="#d97706" />,
                    ][index]
                  }
                </div>
              </div>
            </div>
          ))
      ) : (
        <>
          <div style={{ ...styles.card, borderLeft: "4px solid #088395" }}>
            <div style={styles.cardContent}>
              <div>
                <p style={styles.cardLabel}>Total Buy Letters</p>
                <p style={styles.cardValue}>{dashboardData.totalBuyLetters}</p>
              </div>
              <div
                style={{
                  ...styles.cardIcon,
                  backgroundColor: "rgba(8, 131, 149, 0.15)",
                }}
              >
                <FileText size={32} color="#088395" />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, borderLeft: "4px solid #37B7C3" }}>
            <div style={styles.cardContent}>
              <div>
                <p style={styles.cardLabel}>Total Sell Letters</p>
                <p style={styles.cardValue}>{dashboardData.totalSellLetters}</p>
              </div>
              <div
                style={{
                  ...styles.cardIcon,
                  backgroundColor: "rgba(55, 183, 195, 0.15)",
                }}
              >
                <TrendingUp size={32} color="#088395" />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, borderLeft: "4px solid #8b5cf6" }}>
            <div style={styles.cardContent}>
              <div>
                <p style={styles.cardLabel}>Total Services</p>
                <p style={styles.cardValue}>{dashboardData.totalServices}</p>
              </div>
              <div style={{ ...styles.cardIcon, backgroundColor: "#ede9fe" }}>
                <Wrench size={32} color="#7c3aed" />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, borderLeft: "4px solid #f59e0b" }}>
            <div style={styles.cardContent}>
              <div>
                <p style={styles.cardLabel}>Total Advance Bills</p>
                <p style={styles.cardValue}>
                  {dashboardData.totalAdvanceBills || 0}
                </p>
              </div>
              <div style={{ ...styles.cardIcon, backgroundColor: "#fef3c7" }}>
                <FileText size={32} color="#d97706" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const RevenueCard = () => (
    <div style={styles.revenueCard}>
      <h3 style={styles.revenueTitle}>
        {isOwnerView ? "My Financial Summary" : "Business Revenue Overview"}
      </h3>
      {loading ? (
        <div style={styles.revenueGrid}>
          {Array(3)
            .fill()
            .map((_, index) => (
              <div key={index} style={styles.revenueItem}>
                <p style={styles.revenueLabel}>Loading...</p>
                <p
                  style={{
                    ...styles.revenueValue,
                    color: ["#dc2626", "#088395", "#088395"][index],
                  }}
                >
                  -
                </p>
              </div>
            ))}
        </div>
      ) : (
        <div style={styles.revenueGrid}>
          <div style={styles.revenueItem}>
            <p style={styles.revenueLabel}>
              {isOwnerView ? "My Total Purchases" : "Total Business Purchases"}
            </p>
            <p style={{ ...styles.revenueValue, color: "#dc2626" }}>
              {formatCurrency(dashboardData.totalBuyValue)}
              {isOwnerView && (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    display: "block",
                  }}
                >
                  ({dashboardData.totalBuyLetters} transactions)
                </span>
              )}
            </p>
          </div>
          <div style={styles.revenueItem}>
            <p style={styles.revenueLabel}>
              {isOwnerView ? "My Total Sales" : "Total Business Sales"}
            </p>
            <p style={{ ...styles.revenueValue, color: "#088395" }}>
              {formatCurrency(dashboardData.totalSellValue)}
              {isOwnerView && (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    display: "block",
                  }}
                >
                  ({dashboardData.totalSellLetters} transactions)
                </span>
              )}
            </p>
          </div>
          <div style={styles.revenueItem}>
            <p style={styles.revenueLabel}>Net Profit/Loss</p>
            <p
              style={{
                ...styles.revenueValue,
                color: dashboardData.profit >= 0 ? "#088395" : "#dc2626",
              }}
            >
              {formatCurrency(dashboardData.profit)}
              {dashboardData.totalBuyValue > 0 && (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: dashboardData.profit >= 0 ? "#059669" : "#dc2626",
                    display: "block",
                  }}
                >
                  {dashboardData.profit >= 0 ? "Profit" : "Loss"}:{" "}
                  {Math.abs(
                    (dashboardData.profit / dashboardData.totalBuyValue) * 100,
                  ).toFixed(2)}
                  %
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...styles.container, paddingTop: isMobile ? "56px" : "0" }}>
      {/* Mobile Top Bar */}
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={styles.pageTitle}>Dashboard</h1>
                <p style={styles.pageSubtitle}>
                  {isOwnerView ? (
                    <>
                      Personal financial overview for{" "}
                      <strong>{dashboardData.ownerName || user?.name}</strong>
                    </>
                  ) : (
                    "Monitor your business performance and manage operations"
                  )}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: "16px", alignItems: "center" }}
              >
                <button
                  onClick={toggleOwnerView}
                  style={{
                    backgroundColor: isOwnerView ? "#10b981" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    ":hover": {
                      backgroundColor: isOwnerView ? "#059669" : "#2563eb",
                    },
                  }}
                >
                  {isOwnerView ? "Business View" : "Owner View"}
                </button>
                <button
                  onClick={fetchDashboardData}
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    ":hover": {
                      backgroundColor: "#d97706",
                    },
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {activeMenu === "Dashboard" && (
            <>
              <DashboardCards />
              <RevenueCard />

              {/* Quick Actions */}
              <div style={styles.quickActionsCard}>
                <h3 style={styles.quickActionsTitle}>Quick Actions</h3>
                <div style={styles.quickActionsGrid}>
                  <button
                    style={{
                      ...styles.quickActionButton,
                      backgroundColor: "#eff6ff",
                    }}
                    onClick={() => navigate("/buy/create")}
                  >
                    <ShoppingCart
                      size={24}
                      color="#088395"
                      style={styles.quickActionIcon}
                    />
                    <p style={styles.quickActionTitle}>Create Buy Letter</p>
                    <p style={styles.quickActionSubtitle}>Add new purchase</p>
                  </button>
                  <button
                    style={{
                      ...styles.quickActionButton,
                      backgroundColor: "#f0fdf4",
                    }}
                    onClick={() => navigate("/sell/create")}
                  >
                    <TrendingUp
                      size={24}
                      color="#059669"
                      style={styles.quickActionIcon}
                    />
                    <p style={styles.quickActionTitle}>Create Sell Letter</p>
                    <p style={styles.quickActionSubtitle}>Record new sale</p>
                  </button>
                  <button
                    style={{
                      ...styles.quickActionButton,
                      backgroundColor: "#faf5ff",
                    }}
                    onClick={() => navigate("/service/create")}
                  >
                    <Wrench
                      size={24}
                      color="#7c3aed"
                      style={styles.quickActionIcon}
                    />
                    <p style={styles.quickActionTitle}>Service Bill</p>
                    <p style={styles.quickActionSubtitle}>
                      Create service record
                    </p>
                  </button>
                  <button
                    style={{
                      ...styles.quickActionButton,
                      backgroundColor: "#fffbeb",
                    }}
                    onClick={() => navigate("/staff/create")}
                  >
                    <Users
                      size={24}
                      color="#d97706"
                      style={styles.quickActionIcon}
                    />
                    <p style={styles.quickActionTitle}>Add Staff</p>
                    <p style={styles.quickActionSubtitle}>Register new staff</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeMenu !== "Dashboard" && (
            <div style={styles.placeholderCard}>
              <h2 style={styles.placeholderTitle}>{activeMenu}</h2>
              <p style={styles.placeholderText}>
                This section is under development. Content for {activeMenu} will
                be implemented here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#EBF4F6",
    fontFamily: "Arial, sans-serif",
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
  // Sidebar Styles
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
    borderBottom: "1px solid #1e293b",
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
    backgroundColor: "#1a2536",
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
    borderTop: "1px solid #1e293b",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#7f1d1d20",
    },
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
  },
  contentPadding: {
    padding: "32px",
  },
  header: {
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    color: "#6b7280",
    marginTop: "8px",
    margin: "8px 0 0 0",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    transition: "transform 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  cardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#6b7280",
    margin: 0,
  },
  cardValue: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "4px 0 0 0",
  },
  cardIcon: {
    padding: "12px",
    borderRadius: "50%",
  },
  revenueCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    marginBottom: "24px",
  },
  revenueTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    margin: "0 0 16px 0",
  },
  revenueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  revenueItem: {
    textAlign: "center",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    transition: "transform 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  revenueLabel: {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: 0,
  },
  revenueValue: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    margin: "4px 0 0 0",
  },
  quickActionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "24px",
  },
  quickActionsTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    margin: "0 0 16px 0",
  },
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  quickActionButton: {
    padding: "16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "transform 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  quickActionIcon: {
    marginBottom: "8px",
  },
  quickActionTitle: {
    fontWeight: "500",
    color: "#1f2937",
    margin: 0,
  },
  quickActionSubtitle: {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "32px",
    textAlign: "center",
  },
  placeholderTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    margin: "0 0 16px 0",
  },
  placeholderText: {
    color: "#6b7280",
    margin: 0,
  },
};

export default StaffPage;
