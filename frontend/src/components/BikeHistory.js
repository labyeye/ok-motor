// BikeHistory.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Download,
  Edit,
  Trash2,
  X,
  Bike,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthContext = {
  user: { name: "John Admin" },
  logout: () => console.log("Logged out"),
};

const BikeHistory = () => {
  const { user, logout } = AuthContext;
  const [activeMenu, setActiveMenu] = useState("Bike History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bikeHistory, setBikeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchBikeHistory = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const [buyLetters, sellLetters, serviceBills] = await Promise.all([
        axios.get(
          `http://localhost:2500/api/buy-letter/by-registration?registrationNumber=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        axios.get(
          `http://localhost:2500/api/sell-letters/by-registration?registrationNumber=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        axios.get(
          `http://localhost:2500/api/service-bills/by-registration?registrationNumber=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
      ]);

      // Ensure we're working with arrays
      const buyData = Array.isArray(buyLetters.data) ? buyLetters.data : [];
      const sellData = Array.isArray(sellLetters.data) ? sellLetters.data : [];
      const serviceData = Array.isArray(serviceBills.data?.data)
        ? serviceBills.data.data
        : Array.isArray(serviceBills.data)
        ? serviceBills.data
        : [];

      const combinedData = [
        ...buyData.map((item) => ({
          ...item,
          type: "buy",
          date: item.saleDate || item.createdAt,
        })),
        ...sellData.map((item) => ({
          ...item,
          type: "sell",
          date: item.saleDate || item.createdAt,
        })),
        ...serviceData.map((item) => ({
          ...item,
          type: "service",
          date: item.serviceDate || item.createdAt,
        })),
      ];

      combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBikeHistory(combinedData);
    } catch (error) {
      console.error("Error fetching bike history:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchBikeHistory();
      } else {
        setBikeHistory([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const getActionIcon = (type) => {
    switch (type) {
      case "buy":
        return <ArrowDownLeft size={16} color="#3b82f6" />;
      case "sell":
        return <ArrowUpRight size={16} color="#ef4444" />;
      case "service":
        return <Wrench size={16} color="#10b981" />;
      default:
        return <FileText size={16} />;
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case "buy":
        return "Purchased";
      case "sell":
        return "Sold";
      case "service":
        return "Serviced";
      default:
        return "Activity";
    }
  };

  const getAmount = (item) => {
    if (item.type === "buy" || item.type === "sell") {
      return `₹${item.saleAmount}`;
    }
    if (item.type === "service") {
      return `₹${item.grandTotal}`;
    }
    return "";
  };

  const getDetails = (item) => {
    if (item.type === "buy") {
      return `Purchased from ${item.sellerName}`;
    }
    if (item.type === "sell") {
      return `Sold to ${item.buyerName}`;
    }
    if (item.type === "service") {
      return `Service: ${item.serviceType} (${item.serviceItems.length} items)`;
    }
    return "";
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
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
      ],
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
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Bike History",
      icon: Bike,
      path: "/bike-history",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };
  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Admin Panel</h2>
          <p style={styles.sidebarSubtitle}>Welcome, {user?.name}</p>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                style={{
                  ...styles.menuItem,
                  ...(activeMenu === item.name ? styles.menuItemActive : {}),
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

              {item.submenu && expandedMenus[item.name] && (
                <div style={styles.submenu}>
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

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Bike History</h1>
            <p style={styles.pageSubtitle}>
              Track all activities for a specific bike
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Enter bike registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading bike history...</p>
            </div>
          ) : bikeHistory.length === 0 ? (
            <div style={styles.emptyState}>
              {searchTerm ? (
                <p>No history found for this bike</p>
              ) : (
                <p>Enter a bike registration number to search</p>
              )}
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Date & Time</th>
                    <th style={styles.tableHeader}>Action</th>
                    <th style={styles.tableHeader}>Amount</th>
                    <th style={styles.tableHeader}>Details</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bikeHistory.map((item) => (
                    <tr
                      key={`${item.type}-${item._id}`}
                      style={styles.tableRow}
                    >
                      <td style={styles.tableCell}>
                        {new Date(item.date).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td style={styles.tableCell}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {getActionIcon(item.type)}
                          {getActionLabel(item.type)}
                        </div>
                      </td>
                      <td style={styles.tableCell}>{getAmount(item)}</td>
                      <td style={styles.tableCell}>{getDetails(item)}</td>

                      <td style={styles.tableCell}>
                        <button
                          onClick={() => {
                            if (item.type === "buy") {
                              navigate(`/buy/history/${item._id}`);
                            } else if (item.type === "sell") {
                              navigate(`/sell/history/${item._id}`);
                            } else if (item.type === "service") {
                              navigate(`/service/history/${item._id}`);
                            }
                          }}
                          style={styles.viewButton}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
    backgroundImage: "linear-gradient(to bottom, #1e293b, #0f172a)",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #334155",
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
      backgroundColor: "#334155",
    },
  },
  menuItemActive: {
    backgroundColor: "#334155",
    borderRight: "3px solid #3b82f6",
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
    borderTop: "1px solid #334155",
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
    width: "100%",
    maxWidth: "500px",
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
    backgroundColor: "#f8fafc",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
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
    backgroundColor: "#f1f5f9",
    color: "#334155",
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
    color: "#334155",
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
  verifiedBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  unverifiedBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  viewButton: {
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
};

export default BikeHistory;
