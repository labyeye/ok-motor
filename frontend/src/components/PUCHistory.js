import React, { useState, useContext, useEffect } from "react";
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
  Settings,
  RefreshCw,
  Megaphone,
  Image as ImageIcon,
  Bike,
  Menu,
  X,
  Shield,
  Trash2,
  FileText,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";

const PUCHistory = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sidebar states
  const [activeMenu, setActiveMenu] = useState("PUC");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      const response = await axios.get(`${API_BASE_URL}/puc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching PUC history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    navigate("/puc/create", { state: { pucData: item } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/puc/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHistory();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
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
      name: "Insurance",
      icon: Shield,
      submenu: [
        { name: "Add Insurance", path: "/insurance/create" },
        { name: "Insurance List", path: "/insurance/history" },
      ],
    },
    {
      name: "PUC",
      icon: FileText,
      submenu: [
        { name: "Add PUC", path: "/puc/create" },
        { name: "PUC List", path: "/puc/history" },
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
      icon: ImageIcon,
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
      transition: "transform 0.3s ease-in-out",
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 14,
    },
    topBar: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "60px",
      backgroundColor: "#fff",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      zIndex: 14,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
    },
    hamburgerMenu: {
      cursor: "pointer",
      color: "#1e293b",
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
      backgroundColor: "#051238",
      overflow: "hidden",
    },
    submenuItem: {
      padding: "10px 24px 10px 64px",
      cursor: "pointer",
      color: "#cbd5e1",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
    },
    submenuItemActive: {
      color: "#37B7C3",
      fontWeight: "500",
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
    },
    mainContent: {
      flex: 1,
      overflowY: "auto",
      height: "100vh",
      backgroundColor: "#ffffffff",
    },
    contentPadding: {
      padding: isMobile ? "24px 16px" : "32px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    },
    titleGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#0f172a",
      margin: 0,
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      padding: "24px",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "800px",
    },
    th: {
      textAlign: "left",
      padding: "12px 16px",
      borderBottom: "2px solid #e2e8f0",
      color: "#475569",
      fontWeight: "600",
      fontSize: "0.875rem",
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      color: "#334155",
      fontSize: "0.875rem",
    },
    deleteBtn: {
      padding: "6px 12px",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "60px" : "0",
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Top Bar */}
      <div
        style={{
          ...styles.topBar,
          display: isMobile && !isSidebarOpen ? "flex" : "none",
        }}
      >
        <div
          style={styles.hamburgerMenu}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

      {/* Sidebar */}
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
          <p
            className="sidebar-subtitle"
            style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "4px" }}
          >
            Welcome, {user?.name || "User"}
          </p>
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

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleGroup}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={24} />
              </div>
              <h1 style={styles.title}>PUC History</h1>
            </div>
          </div>

          <div style={styles.card}>
            {loading ? (
              <p>Loading...</p>
            ) : history.length === 0 ? (
              <p>No PUC records found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Person Name</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Vehicle</th>
                    <th style={styles.th}>Reg No</th>
                    <th style={styles.th}>PUC Certificate No</th>
                    <th style={styles.th}>Expiry Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>
                      <td style={styles.td}>{item.personName}</td>
                      <td style={styles.td}>{item.personPhone}</td>
                      <td style={styles.td}>
                        {item.brand} {item.vehicleModel} ({item.year})
                      </td>
                      <td style={styles.td}>{item.regNo}</td>
                      <td style={styles.td}>{item.pucNumber}</td>
                      <td style={styles.td}>
                        {(() => {
                          const d = item.pucExpiry || item.pucExpiryDate;
                          if (!d) return "—";
                          const parsed = new Date(d);
                          return isNaN(parsed) ? "—" : parsed.toLocaleDateString("en-IN");
                        })()}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={{
                              ...styles.deleteBtn,
                              backgroundColor: "#e0f2fe",
                              color: "#0284c7",
                            }}
                            onClick={() => handleEdit(item)}
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 size={16} /> Delete
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

export default PUCHistory;
